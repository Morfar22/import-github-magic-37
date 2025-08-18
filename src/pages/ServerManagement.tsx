import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Server, Plus, Activity, Users, Clock, Zap, Trash2, Settings, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ServerStatsManager from '@/components/ServerStatsManager';

interface ServerData {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  created_at: string;
}

interface ServerStats {
  id: string;
  server_id: string;
  players_online: number;
  max_players: number;
  queue_count: number;
  uptime_percentage: number;
  ping_ms: number;
  server_online: boolean;
  last_updated: string;
}

export default function ServerManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [serverStats, setServerStats] = useState<{ [key: string]: ServerStats }>({});
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);
  const [showStatsManager, setShowStatsManager] = useState(false);
  const [newServer, setNewServer] = useState({
    name: '',
    ip_address: '',
    port: 30120
  });

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setIsStaff(false);
        setCheckingStaff(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_staff', { _user_id: user.id });

        if (error) {
          console.error('Error checking staff role:', error);
          setIsStaff(false);
        } else {
          setIsStaff(data);
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setIsStaff(false);
      } finally {
        setCheckingStaff(false);
      }
    };

    checkStaffRole();
    fetchServers();
    fetchServerStats();
    
    // Set up real-time subscriptions
    const serverChannel = supabase
      .channel('servers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, () => {
        fetchServers();
      })
      .subscribe();

    const statsChannel = supabase
      .channel('server-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_server_stats' }, () => {
        fetchServerStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(serverChannel);
      supabase.removeChannel(statsChannel);
    };
  }, [user]);


  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch servers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStats = async () => {
    try {
      const { data, error } = await supabase
        .from('individual_server_stats')
        .select('*');

      if (error) throw error;
      
      const statsMap: { [key: string]: ServerStats } = {};
      data?.forEach(stat => {
        statsMap[stat.server_id] = stat;
      });
      setServerStats(statsMap);
    } catch (error) {
      console.error('Error fetching server stats:', error);
    }
  };

  const addServer = async () => {
    if (!isStaff) {
      toast({
        title: "Access Denied",
        description: "Only staff members can add servers",
        variant: "destructive",
      });
      return;
    }

    if (!newServer.name || !newServer.ip_address) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('servers')
        .insert([{
          name: newServer.name,
          ip_address: newServer.ip_address,
          port: newServer.port,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server added successfully",
      });

      setNewServer({ name: '', ip_address: '', port: 30120 });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding server:', error);
      toast({
        title: "Error",
        description: "Failed to add server",
        variant: "destructive",
      });
    }
  };

  const deleteServer = async (serverId: string) => {
    if (!isStaff) {
      toast({
        title: "Access Denied",
        description: "Only staff members can delete servers",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting server:', error);
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
    }
  };

  const fetchLiveStats = async (serverId: string, serverIp: string, port: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-individual-server-stats', {
        body: { serverId, serverIp, port }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live stats fetched successfully",
      });
    } catch (error) {
      console.error('Error fetching live stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live stats",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (online: boolean) => {
    return online ? "text-green-500" : "text-red-500";
  };

  const getPingColor = (ping: number) => {
    if (ping <= 50) return "text-green-500";
    if (ping <= 100) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
              <p className="text-foreground">Loading servers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Server Status</h1>
            <p className="text-muted-foreground">Monitor live server statistics</p>
            {isStaff && (
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-neon-purple/20 text-neon-purple border-neon-purple/50">
                  Staff Access: Full Management
                </Badge>
              </div>
            )}
          </div>
          
          {isStaff && (
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowStatsManager(!showStatsManager)}
                variant={showStatsManager ? "default" : "outline"}
                className={showStatsManager ? "bg-neon-green hover:bg-neon-green/80" : ""}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showStatsManager ? "Hide Stats Manager" : "Manage Stats"}
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-neon-purple hover:bg-neon-purple/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Server
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-gaming-card border-gaming-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Server</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new server to monitor its status and statistics.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input
                    id="serverName"
                    value={newServer.name}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    placeholder="e.g., Main Server"
                    className="bg-background border-input"
                  />
                </div>
                <div>
                  <Label htmlFor="serverIp">IP Address</Label>
                  <Input
                    id="serverIp"
                    value={newServer.ip_address}
                    onChange={(e) => setNewServer({ ...newServer, ip_address: e.target.value })}
                    placeholder="e.g., 192.168.1.100"
                    className="bg-background border-input"
                  />
                </div>
                <div>
                  <Label htmlFor="serverPort">Port</Label>
                  <Input
                    id="serverPort"
                    type="number"
                    value={newServer.port}
                    onChange={(e) => setNewServer({ ...newServer, port: parseInt(e.target.value) || 30120 })}
                    className="bg-background border-input"
                  />
                </div>
                <Button onClick={addServer} className="w-full bg-neon-purple hover:bg-neon-purple/80">
                  Add Server
                </Button>
              </div>
            </DialogContent>
            </Dialog>
            </div>
          )}
        </div>


        {/* Stats Manager Section */}
        {isStaff && showStatsManager && (
          <div className="mb-8">
            <ServerStatsManager />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => {
            const stats = serverStats[server.id];
            const isOnline = stats?.server_online || false;
            const lastUpdated = stats?.last_updated ? new Date(stats.last_updated) : null;
            const timeSinceUpdate = lastUpdated ? Date.now() - lastUpdated.getTime() : null;
            const isStale = timeSinceUpdate ? timeSinceUpdate > 5 * 60 * 1000 : true; // 5 minutes

            return (
              <Card key={server.id} className="bg-gaming-card border-gaming-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center">
                      <Server className="w-5 h-5 mr-2" />
                      {server.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isOnline ? "default" : "destructive"}>
                        <Activity className={`w-3 h-3 mr-1 ${getStatusColor(isOnline)}`} />
                        {isOnline ? "Online" : "Offline"}
                      </Badge>
                      {isStaff && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteServer(server.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {server.ip_address}:{server.port}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {stats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            Players
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {stats.players_online}/{stats.max_players}
                          </div>
                          <Progress 
                            value={(stats.players_online / stats.max_players) * 100} 
                            className="h-2" 
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            Queue
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {stats.queue_count}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Activity className="w-4 h-4 mr-1" />
                            Uptime
                          </div>
                          <div className="text-lg font-semibold text-green-500">
                            {stats.uptime_percentage}%
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Zap className="w-4 h-4 mr-1" />
                            Ping
                          </div>
                          <div className={`text-lg font-semibold ${getPingColor(stats.ping_ms)}`}>
                            {stats.ping_ms}ms
                          </div>
                        </div>
                      </div>

                      {isStale && (
                        <div className="text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded">
                          Data may be outdated (last updated: {lastUpdated?.toLocaleTimeString()})
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-muted-foreground mb-2">No stats available</div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchLiveStats(server.id, server.ip_address, server.port)}
                    className="w-full"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Fetch Live Stats
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {servers.length === 0 && (
          <div className="text-center py-12">
            <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No servers added yet</h3>
            <p className="text-muted-foreground mb-4">
              {isStaff ? "Add your first server to start monitoring its status" : "No servers are currently being monitored"}
            </p>
            {isStaff && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-neon-purple hover:bg-neon-purple/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Server
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gaming-card border-gaming-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Server</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Add a new server to monitor its status and statistics.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="serverName">Server Name</Label>
                    <Input
                      id="serverName"
                      value={newServer.name}
                      onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                      placeholder="e.g., Main Server"
                      className="bg-background border-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serverIp">IP Address</Label>
                    <Input
                      id="serverIp"
                      value={newServer.ip_address}
                      onChange={(e) => setNewServer({ ...newServer, ip_address: e.target.value })}
                      placeholder="e.g., 192.168.1.100"
                      className="bg-background border-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serverPort">Port</Label>
                    <Input
                      id="serverPort"
                      type="number"
                      value={newServer.port}
                      onChange={(e) => setNewServer({ ...newServer, port: parseInt(e.target.value) || 30120 })}
                      className="bg-background border-input"
                    />
                  </div>
                  <Button onClick={addServer} className="w-full bg-neon-purple hover:bg-neon-purple/80">
                    Add Server
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}