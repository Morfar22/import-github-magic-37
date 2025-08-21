import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface TwitchStreamer {
  id: string;
  username: string;
  twitch_username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  order_index: number;
}

interface StreamData {
  is_live: boolean;
  viewer_count?: number;
  game_name?: string;
  title?: string;
  started_at?: string;
  thumbnail_url?: string;
}

const Live = () => {
  const [streamers, setStreamers] = useState<TwitchStreamer[]>([]);
  const [streamData, setStreamData] = useState<Record<string, StreamData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreamers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('twitch-streamers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'twitch_streamers'
        },
        () => {
          fetchStreamers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStreamers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitch-streams');

      if (error) {
        console.error('Error calling fetch-twitch-streams:', error);
        throw error;
      }

      if (data) {
        setStreamers(data.streamers || []);
        setStreamData(data.streamData || {});
      }
    } catch (error) {
      console.error('Error fetching streamers:', error);
      // Fallback to empty data on error
      setStreamers([]);
      setStreamData({});
    } finally {
      setLoading(false);
    }
  };

  const liveStreamers = streamers.filter(streamer => 
    streamData[streamer.twitch_username]?.is_live
  );
  
  const offlineStreamers = streamers.filter(streamer => 
    !streamData[streamer.twitch_username]?.is_live
  );

  const formatUptime = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Live Streams
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch our community members live on Twitch playing on Dreamlight RP
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
                  <div className="aspect-video bg-gaming-dark rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gaming-dark rounded w-3/4" />
                    <div className="h-3 bg-gaming-dark rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Live Streamers */}
              {liveStreamers.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <h2 className="text-2xl font-semibold text-foreground">
                      Live Now ({liveStreamers.length})
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveStreamers.map((streamer) => {
                      const stream = streamData[streamer.twitch_username];
                      return (
                        <Card 
                          key={streamer.id} 
                          className="overflow-hidden bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300 group"
                        >
                          <div className="relative">
                            {/* Stream Thumbnail */}
                            {stream?.thumbnail_url ? (
                              <img 
                                src={stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180') + `?v=${Date.now()}`}
                                alt={`${streamer.twitch_username} live stream`}
                                className="aspect-video w-full object-cover"
                              />
                            ) : (
                              <div className="aspect-video bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center">
                                <div className="text-center">
                                  <Users className="h-8 w-8 text-neon-purple mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Live Stream</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Live Badge */}
                            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                              LIVE
                            </Badge>
                            
                            {/* Viewer Count */}
                            <Badge 
                              variant="secondary" 
                              className="absolute top-2 right-2 bg-black/70 text-white"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {stream?.viewer_count}
                            </Badge>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              {streamer.avatar_url ? (
                                <img 
                                  src={streamer.avatar_url} 
                                  alt={streamer.display_name || streamer.username}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-neon-purple" />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">
                                  {streamer.display_name || streamer.username}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  @{streamer.twitch_username}
                                </p>
                              </div>
                            </div>
                            
                            {stream?.title && (
                              <p className="text-sm text-foreground mb-2 line-clamp-2">
                                {stream.title}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <span>{stream?.game_name}</span>
                              {stream?.started_at && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatUptime(stream.started_at)}</span>
                                </div>
                              )}
                            </div>
                            
                            <a
                              href={`https://twitch.tv/${streamer.twitch_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium group-hover:bg-purple-500"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Watch on Twitch
                            </a>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Offline Streamers */}
              {offlineStreamers.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    Offline Streamers
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {offlineStreamers.map((streamer) => (
                      <Card 
                        key={streamer.id} 
                        className="p-4 bg-gaming-card border-gaming-border hover:border-gaming-border-hover transition-colors"
                      >
                        <div className="text-center">
                          {streamer.avatar_url ? (
                            <img 
                              src={streamer.avatar_url} 
                              alt={streamer.display_name || streamer.username}
                              className="w-12 h-12 rounded-full mx-auto mb-2 grayscale"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gaming-dark flex items-center justify-center mx-auto mb-2">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <h3 className="font-medium text-foreground text-sm truncate">
                            {streamer.display_name || streamer.username}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            @{streamer.twitch_username}
                          </p>
                          
                          <a
                            href={`https://twitch.tv/${streamer.twitch_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center text-xs text-neon-purple hover:text-neon-purple/80 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Channel
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Streamers */}
              {streamers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Streamers Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Check back later for live streams from our community!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Live;