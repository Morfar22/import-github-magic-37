import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Clock, Globe, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServerStats {
  players_online: number;
  max_players: number;
  queue_count: number;
  uptime_percentage: number;
  ping_ms: number;
  last_updated: string;
}

const GLOW_STYLES = [
  {
    border: "hsl(120, 100%, 50%)", // neon green
    shadow: "0 0 18px 4px hsl(120, 100%, 50%, 0.6)",
  },
  {
    border: "hsl(217, 91%, 60%)", // neon blue
    shadow: "0 0 18px 4px hsl(217, 91%, 60%, 0.6)",
  },
  {
    border: "hsl(280, 100%, 70%)", // neon purple
    shadow: "0 0 18px 4px hsl(280, 100%, 70%, 0.6)",
  },
  {
    border: "hsl(120, 100%, 50%)", // neon green
    shadow: "0 0 18px 4px hsl(120, 100%, 50%, 0.6)",
  },
];

const ServerStats = () => {
  const [stats, setStats] = useState<ServerStats>({
    players_online: 0,
    max_players: 300,
    queue_count: 0,
    uptime_percentage: 99.9,
    ping_ms: 15,
    last_updated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  // Store hover state for each card
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    fetchServerStats();

    const interval = setInterval(fetchServerStats, 30000);

    const channel = supabase
      .channel("server-stats-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "server_stats",
        },
        (payload) => {
          console.log("Server stats updated:", payload);
          if (payload.new) {
            setStats(payload.new as ServerStats);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, []);

  const fetchServerStats = async () => {
    try {
      const { data, error } = await supabase
        .from("server_stats")
        .select("*")
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching server stats:", error);
        return;
      }

      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching server stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 bg-gaming-card border-gaming-border animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gaming-dark rounded" />
              <div>
                <div className="h-6 w-12 bg-gaming-dark rounded mb-1" />
                <div className="h-4 w-16 bg-gaming-dark rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div
          className={`w-3 h-3 rounded-full ${
            stats.players_online > 0 ? "bg-neon-green animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-muted-foreground">
          {stats.players_online > 0
            ? "Server Online"
            : "Server Offline"}{" "}
          • Last updated:{" "}
          {new Date(stats.last_updated).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Players Online */}
        <Card
          className="p-4 bg-gaming-card border-gaming-border transition-all duration-300"
          style={
            hoveredCard === 0
              ? {
                  borderColor: GLOW_STYLES[0].border,
                  boxShadow: GLOW_STYLES[0].shadow,
                }
              : undefined
          }
          onMouseEnter={() => setHoveredCard(0)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-neon-green" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.players_online}/{stats.max_players}
              </p>
              <p className="text-sm text-muted-foreground">
                Players Online
              </p>
              {stats.players_online > 0 && (
                <div className="w-full bg-gaming-dark rounded-full h-1.5 mt-1">
                  <div
                    className="bg-neon-green h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (stats.players_online / stats.max_players) * 100
                      }%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Uptime */}
        <Card
          className="p-4 bg-gaming-card border-gaming-border transition-all duration-300"
          style={
            hoveredCard === 1
              ? {
                  borderColor: GLOW_STYLES[1].border,
                  boxShadow: GLOW_STYLES[1].shadow,
                }
              : undefined
          }
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-neon-blue" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.uptime_percentage}%
              </p>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <div className="w-full bg-gaming-dark rounded-full h-1.5 mt-1">
                <div
                  className="bg-neon-blue h-1.5 rounded-full"
                  style={{ width: `${stats.uptime_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Queue */}
        <Card
          className="p-4 bg-gaming-card border-gaming-border transition-all duration-300"
          style={
            hoveredCard === 2
              ? {
                  borderColor: GLOW_STYLES[2].border,
                  boxShadow: GLOW_STYLES[2].shadow,
                }
              : undefined
          }
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-neon-purple" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.queue_count}
              </p>
              <p className="text-sm text-muted-foreground">Queue</p>
              {stats.queue_count > 0 && (
                <p className="text-xs text-orange-400 mt-1">
                  ~{stats.queue_count * 2} min wait
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Ping */}
        <Card
          className="p-4 bg-gaming-card border-gaming-border transition-all duration-300"
          style={
            hoveredCard === 3
              ? {
                  borderColor: GLOW_STYLES[3].border,
                  boxShadow: GLOW_STYLES[3].shadow,
                }
              : undefined
          }
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center space-x-3">
            <Zap
              className={`h-8 w-8 ${
                stats.ping_ms < 50
                  ? "text-neon-green"
                  : stats.ping_ms < 100
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.ping_ms}ms
              </p>
              <p className="text-sm text-muted-foreground">Ping</p>
              <p
                className={`text-xs mt-1 ${
                  stats.ping_ms < 50
                    ? "text-neon-green"
                    : stats.ping_ms < 100
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {stats.ping_ms < 50
                  ? "Excellent"
                  : stats.ping_ms < 100
                  ? "Good"
                  : "High"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ServerStats;
