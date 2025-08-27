import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Server, Clock, Zap, Globe, Activity, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServerData {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  stats?: {
    players_online: number;
    max_players: number;
    queue_count: number;
    uptime_percentage: number;
    ping_ms: number;
    server_online: boolean;
    last_updated: string;
  };
}

interface ServerDashboardProps {
  showTitle?: boolean;
  compactMode?: boolean;
}

const ServerDashboard = ({ showTitle = true, compactMode = false }: ServerDashboardProps) => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [serverInfo, setServerInfo] = useState({
    displayIp: 'connect adventure-rp.com',
    discordUrl: 'https://discord.gg/adventure-rp',
    status: 'online'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServers();
    fetchServerInfo();
    
    // Set up 30-second interval for updates
    const interval = setInterval(fetchServers, 30000);

    // Set up realtime subscriptions
    const serverStatsChannel = supabase
      .channel("server-stats-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "server_stats",
        },
        (payload) => {
          console.log("Server stats updated:", payload);
          fetchServers(); // Refresh all data when stats change
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "individual_server_stats",
        },
        (payload) => {
          console.log("Individual server stats updated:", payload);
          fetchServers(); // Refresh all data when individual stats change
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(serverStatsChannel);
    };
  }, []);

  const fetchServers = async () => {
    try {
      // Fetch servers
      const { data: serversData, error: serversError } = await supabase
        .from("servers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (serversError) throw serversError;

      // Fetch global server stats
      const { data: globalStats, error: globalStatsError } = await supabase
        .from("server_stats")
        .select("*")
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalStatsError) console.error("Error fetching global stats:", globalStatsError);

      // Fetch individual server stats for each server
      const serversWithStats = await Promise.all(
        (serversData || []).map(async (server) => {
          const { data: individualStats, error: individualError } = await supabase
            .from("individual_server_stats")
            .select("*")
            .eq("server_id", server.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (individualError) {
            console.error(`Error fetching stats for server ${server.id}:`, individualError);
          }

          return {
            ...server,
            stats: individualStats || globalStats || {
              players_online: 0,
              max_players: 48,
              queue_count: 0,
              uptime_percentage: 0,
              ping_ms: 0,
              server_online: false,
              last_updated: new Date().toISOString(),
            },
          };
        })
      );

      setServers(serversWithStats);
    } catch (error) {
      console.error("Error fetching servers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch server data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['server_display_ip', 'discord_url', 'server_status']);

      if (error) {
        console.error('Error fetching server info:', error);
        return;
      }

      if (data) {
        const settings: any = {};
        data.forEach(setting => {
          settings[setting.setting_key] = setting.setting_value;
        });

        setServerInfo({
          displayIp: settings.server_display_ip || 'connect adventure-rp.com',
          discordUrl: settings.discord_url || 'https://discord.gg/adventure-rp',
          status: settings.server_status || 'online'
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleRefreshStats = async () => {
    try {
      // Call the auto-fetch function to manually trigger stats update
      const { error } = await supabase.functions.invoke("auto-fetch-server-stats");
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Server stats refreshed successfully",
      });
      
      // Refresh the data
      await fetchServers();
      await fetchServerInfo();
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast({
        title: "Error", 
        description: "Failed to refresh server stats",
        variant: "destructive",
      });
    }
  };

  const getServerStatusIcon = (isOnline: boolean) => {
    return isOnline ? (
      <Wifi className="h-4 w-4 text-neon-green" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (isOnline: boolean, players: number) => {
    if (!isOnline) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
          Offline
        </Badge>
      );
    }
    
    if (players > 0) {
      return (
        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
          Active
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
        Online
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground font-orbitron">Server Status</h2>
          </div>
        )}
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gaming-dark rounded w-1/3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-16 bg-gaming-dark rounded" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="h-6 w-6 text-neon-teal" />
            <h2 className="text-2xl font-bold text-foreground font-orbitron">Server Status</h2>
          </div>
          <Button
            onClick={handleRefreshStats}
            variant="outline"
            size="sm"
            className="border-neon-teal/30 hover:border-neon-teal"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>
      )}

      <div className="grid gap-6">
        {servers.map((server) => (
          <Card
            key={server.id}
            className="p-6 bg-gaming-card/90 backdrop-blur-sm border-2 border-gaming-border hover:border-neon-teal/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-teal/20"
          >
            <div className="space-y-4">
              {/* Server Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getServerStatusIcon(server.stats?.server_online || false)}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground font-orbitron">
                      {server.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {server.ip_address}:{server.port}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(server.stats?.server_online || false, server.stats?.players_online || 0)}
                  <span className="text-xs text-muted-foreground">
                    Updated: {server.stats?.last_updated ? 
                      new Date(server.stats.last_updated).toLocaleTimeString() : 
                      'Unknown'
                    }
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Players */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Users className="h-6 w-6 text-neon-green" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {server.stats?.players_online || 0}/{server.stats?.max_players || 48}
                    </p>
                    <p className="text-xs text-muted-foreground">Players</p>
                  </div>
                </div>

                {/* Uptime */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Clock className="h-6 w-6 text-neon-blue" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {server.stats?.uptime_percentage || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </div>

                {/* Queue */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Globe className="h-6 w-6 text-neon-purple" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {server.stats?.queue_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Queue</p>
                  </div>
                </div>

                {/* Ping */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Zap
                    className={`h-6 w-6 ${
                      (server.stats?.ping_ms || 0) < 50
                        ? "text-neon-green"
                        : (server.stats?.ping_ms || 0) < 100
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {server.stats?.ping_ms || 0}ms
                    </p>
                    <p className="text-xs text-muted-foreground">Ping</p>
                  </div>
                </div>
              </div>

              {/* Player Capacity Bar */}
              {server.stats?.players_online !== undefined && server.stats?.max_players && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Server Capacity</span>
                    <span>
                      {Math.round((server.stats.players_online / server.stats.max_players) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gaming-dark rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-neon-green to-neon-teal h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(server.stats.players_online / server.stats.max_players) * 100}%`,
                      }}
                    />
                  </div>
                 </div>
               )}

               {/* Server Connection Info */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gaming-border/30">
                 <div className="flex items-center justify-between p-3 bg-gaming-darker/30 rounded-lg">
                   <span className="text-sm text-muted-foreground">Server IP:</span>
                   <code className="text-sm bg-gaming-dark px-2 py-1 rounded text-neon-teal border border-neon-teal/30">
                     {serverInfo.displayIp}
                   </code>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-gaming-darker/30 rounded-lg">
                   <span className="text-sm text-muted-foreground">Status:</span>
                   <Badge className={
                     serverInfo.status === 'online' ? 'bg-neon-green/20 text-neon-green border-neon-green/30' :
                     serverInfo.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                     'bg-red-500/20 text-red-500 border-red-500/30'
                   }>
                     {serverInfo.status.toUpperCase()}
                   </Badge>
                 </div>
               </div>
             </div>
           </Card>
         ))}

         {servers.length === 0 && (
          <Card className="p-8 bg-gaming-card/50 border-gaming-border text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Servers Found</h3>
            <p className="text-sm text-muted-foreground">
              No active servers are currently configured.
            </p>
          </Card>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        <Activity className="h-3 w-3 mr-1 animate-pulse" />
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
};

export default ServerDashboard;