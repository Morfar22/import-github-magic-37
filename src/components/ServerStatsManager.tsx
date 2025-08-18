import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, Globe, Zap, Save, RefreshCw, Play } from 'lucide-react';

interface ServerStats {
  players_online: number;
  max_players: number;
  queue_count: number;
  uptime_percentage: number;
  ping_ms: number;
  server_online: boolean;
  last_updated: string;
}

interface ConnectSettings {
  connect_ip: string;
  connect_port: number;
  connect_enabled: boolean;
}

interface ServerInfo {
  server_ip: string;
  auto_fetch_enabled: boolean;
}

const ServerStatsManager = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<ServerStats>({
    players_online: 0,
    max_players: 48,
    queue_count: 0,
    uptime_percentage: 100,
    ping_ms: 23,
    server_online: true,
    last_updated: new Date().toISOString()
  });
  
  const [connectSettings, setConnectSettings] = useState<ConnectSettings>({
    connect_ip: 'join.dlrp.dk',
    connect_port: 30121,
    connect_enabled: true
  });
  
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    server_ip: '',
    auto_fetch_enabled: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchCurrentStats();
    fetchConnectSettings();
    fetchServerInfo();
  }, []);

  const fetchCurrentStats = async () => {
    try {
      const { data, error } = await supabase
        .from('server_stats')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching server stats:', error);
        return;
      }

      if (data) {
        setStats({
          players_online: data.players_online,
          max_players: data.max_players,
          queue_count: data.queue_count,
          uptime_percentage: data.uptime_percentage,
          ping_ms: data.ping_ms,
          server_online: (data as any).server_online ?? true, // Type assertion to handle missing types
          last_updated: data.last_updated
        });
      }
    } catch (error) {
      console.error('Error fetching server stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('*')
        .eq('setting_key', 'connect_info')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching connect settings:', error);
        return;
      }

      if (data?.setting_value) {
        const settings = JSON.parse(data.setting_value as string);
        setConnectSettings(settings);
      }
    } catch (error) {
      console.error('Error fetching connect settings:', error);
    }
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('server_stats')
        .upsert([{
          players_online: stats.players_online,
          max_players: stats.max_players,
          queue_count: stats.queue_count,
          uptime_percentage: stats.uptime_percentage,
          ping_ms: stats.ping_ms,
          server_online: stats.server_online,
          last_updated: new Date().toISOString()
        } as any]); // Type assertion to handle missing types

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server stats updated successfully",
      });
    } catch (error) {
      console.error('Error saving server stats:', error);
      toast({
        title: "Error",
        description: "Failed to update server stats",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveConnectSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'connect_info',
          setting_value: JSON.stringify(connectSettings),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Connect settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving connect settings:', error);
      toast({
        title: "Error",
        description: "Failed to update connect settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('*')
        .in('setting_key', ['server_ip', 'auto_fetch_enabled']);

      if (error) {
        console.error('Error fetching server info:', error);
        return;
      }

      const serverIpSetting = data?.find(s => s.setting_key === 'server_ip');
      const autoFetchSetting = data?.find(s => s.setting_key === 'auto_fetch_enabled');

      setServerInfo({
        server_ip: String(serverIpSetting?.setting_value || ''),
        auto_fetch_enabled: autoFetchSetting?.setting_value === true || autoFetchSetting?.setting_value === 'true'
      });
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const fetchLiveStats = async () => {
    if (!serverInfo.server_ip) {
      toast({
        title: "Error",
        description: "Server IP not configured. Please set it in server settings first.",
        variant: "destructive",
      });
      return;
    }

    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-fetch-server-stats', {
        method: 'POST',
        body: {}
      });

      if (error) throw error;

      if (data?.success) {
        await fetchCurrentStats(); // Refresh the displayed stats
        toast({
          title: "Success",
          description: "Live stats fetched successfully from server",
        });
      } else {
        throw new Error(data?.error || 'Failed to fetch live stats');
      }
    } catch (error) {
      console.error('Error fetching live stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live stats from server",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const saveServerInfo = async () => {
    setSaving(true);
    try {
      // Save server IP
      const { error: ipError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'server_ip',
          setting_value: serverInfo.server_ip,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (ipError) throw ipError;

      // Save auto fetch setting
      const { error: autoFetchError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'auto_fetch_enabled',
          setting_value: serverInfo.auto_fetch_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (autoFetchError) throw autoFetchError;

      toast({
        title: "Success",
        description: "Server settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving server info:', error);
      toast({
        title: "Error",
        description: "Failed to update server settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setStats({
      players_online: 0,
      max_players: 48,
      queue_count: 0,
      uptime_percentage: 100,
      ping_ms: 23,
      server_online: true,
      last_updated: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <Card className="bg-gaming-card border-gaming-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Server Connection */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Globe className="w-5 h-5 mr-2 text-neon-green" />
            Live Server Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="server_ip" className="text-sm text-muted-foreground">
                Game Server IP Address
              </Label>
              <Input
                id="server_ip"
                value={serverInfo.server_ip}
                onChange={(e) => setServerInfo({ ...serverInfo, server_ip: e.target.value })}
                placeholder="127.0.0.1"
                className="bg-background border-input"
              />
              <p className="text-xs text-muted-foreground">
                The IP address of your FiveM server for fetching live stats
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Auto-Fetch Mode</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={serverInfo.auto_fetch_enabled}
                  onCheckedChange={(checked) => setServerInfo({ ...serverInfo, auto_fetch_enabled: checked })}
                />
                <Badge variant={serverInfo.auto_fetch_enabled ? "default" : "secondary"}>
                  {serverInfo.auto_fetch_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically fetch stats from server every few minutes
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={saveServerInfo} disabled={saving} className="bg-neon-green hover:bg-neon-green/80">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
            <Button onClick={fetchLiveStats} disabled={fetching || !serverInfo.server_ip} className="bg-neon-purple hover:bg-neon-purple/80">
              {fetching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Fetch Live Stats Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Server Stats Display */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-neon-purple" />
              Current Server Stats
            </div>
            <Badge variant={stats.server_online ? "default" : "destructive"}>
              {stats.server_online ? "Online" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="players_online" className="text-sm text-muted-foreground">
                <Users className="w-4 h-4 inline mr-1" />
                Players Online
              </Label>
              <Input
                id="players_online"
                type="number"
                min="0"
                max={stats.max_players}
                value={stats.players_online}
                onChange={(e) => setStats({ ...stats, players_online: parseInt(e.target.value) || 0 })}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_players" className="text-sm text-muted-foreground">
                <Users className="w-4 h-4 inline mr-1" />
                Max Players
              </Label>
              <Input
                id="max_players"
                type="number"
                min="1"
                value={stats.max_players}
                onChange={(e) => setStats({ ...stats, max_players: parseInt(e.target.value) || 48 })}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue_count" className="text-sm text-muted-foreground">
                <Globe className="w-4 h-4 inline mr-1" />
                Queue Count
              </Label>
              <Input
                id="queue_count"
                type="number"
                min="0"
                value={stats.queue_count}
                onChange={(e) => setStats({ ...stats, queue_count: parseInt(e.target.value) || 0 })}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ping_ms" className="text-sm text-muted-foreground">
                <Zap className="w-4 h-4 inline mr-1" />
                Ping (ms)
              </Label>
              <Input
                id="ping_ms"
                type="number"
                min="1"
                value={stats.ping_ms}
                onChange={(e) => setStats({ ...stats, ping_ms: parseInt(e.target.value) || 23 })}
                className="bg-background border-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uptime_percentage" className="text-sm text-muted-foreground">
                <Clock className="w-4 h-4 inline mr-1" />
                Uptime Percentage
              </Label>
              <Input
                id="uptime_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={stats.uptime_percentage}
                onChange={(e) => setStats({ ...stats, uptime_percentage: parseFloat(e.target.value) || 100 })}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Server Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={stats.server_online}
                  onCheckedChange={(checked) => setStats({ ...stats, server_online: checked })}
                />
                <Badge variant={stats.server_online ? "default" : "destructive"}>
                  {stats.server_online ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-lg border border-gaming-border">
            <p className="text-sm text-muted-foreground mb-1">Last Updated:</p>
            <p className="text-sm text-foreground">
              {new Date(stats.last_updated).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={saveStats} disabled={saving} className="bg-neon-purple hover:bg-neon-purple/80">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Manual Stats
            </Button>
            <Button onClick={fetchLiveStats} disabled={fetching || !serverInfo.server_ip} className="bg-neon-green hover:bg-neon-green/80">
              {fetching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Fetch Live Stats
            </Button>
            <Button onClick={resetToDefaults} variant="outline">
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connect Now Settings */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Globe className="w-5 h-5 mr-2 text-neon-green" />
            Connect Now Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="connect_ip" className="text-sm text-muted-foreground">
                Server IP Address
              </Label>
              <Input
                id="connect_ip"
                value={connectSettings.connect_ip}
                onChange={(e) => setConnectSettings({ ...connectSettings, connect_ip: e.target.value })}
                placeholder="join.dlrp.dk"
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="connect_port" className="text-sm text-muted-foreground">
                Server Port
              </Label>
              <Input
                id="connect_port"
                type="number"
                min="1"
                max="65535"
                value={connectSettings.connect_port}
                onChange={(e) => setConnectSettings({ ...connectSettings, connect_port: parseInt(e.target.value) || 30121 })}
                className="bg-background border-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Connect Button Status</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={connectSettings.connect_enabled}
                onCheckedChange={(checked) => setConnectSettings({ ...connectSettings, connect_enabled: checked })}
              />
              <Badge variant={connectSettings.connect_enabled ? "default" : "destructive"}>
                {connectSettings.connect_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-lg border border-gaming-border">
            <p className="text-sm text-muted-foreground mb-2">Current connect command:</p>
            <code className="text-sm text-foreground bg-gaming-dark px-2 py-1 rounded">
              connect {connectSettings.connect_ip}:{connectSettings.connect_port}
            </code>
          </div>

          <Button onClick={saveConnectSettings} disabled={saving} className="bg-neon-green hover:bg-neon-green/80">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Connect Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerStatsManager;