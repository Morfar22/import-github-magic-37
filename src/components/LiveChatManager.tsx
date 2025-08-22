import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Settings, Users, Save } from "lucide-react";
import LiveChatSupport from "./LiveChatSupport";

interface ChatSettings {
  enabled: boolean;
  auto_assign: boolean;
  max_concurrent_chats: number;
}

const LiveChatManager = () => {
  const [settings, setSettings] = useState<ChatSettings>({
    enabled: false,
    auto_assign: true,
    max_concurrent_chats: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [waitingChats, setWaitingChats] = useState(0);
  const [activeChats, setActiveChats] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadChatStats();
    subscribeToStats();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_settings')
        .single();

      if (error) throw error;

      if (data?.setting_value) {
        setSettings(data.setting_value as any);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
    }
  };

  const loadChatStats = async () => {
    try {
      const { data: waitingData } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('status', 'waiting');

      const { data: activeData } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('status', 'active');

      setWaitingChats(waitingData?.length || 0);
      setActiveChats(activeData?.length || 0);
    } catch (error) {
      console.error('Error loading chat stats:', error);
    }
  };

  const subscribeToStats = () => {
    const channel = supabase
      .channel('chat_stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          loadChatStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'chat_settings',
          setting_value: settings as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Live chat settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save chat settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-neon-teal" />
            <h2 className="text-xl font-semibold text-foreground">Live Chat Management</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>{waitingChats} Waiting</span>
              </Badge>
              <Badge variant="default" className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{activeChats} Active</span>
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="support" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="support">Live Support</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="support">
            <LiveChatSupport />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                <Settings className="h-5 w-5 mr-2 text-neon-teal" />
                Chat Configuration
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Enable Live Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow visitors to start live chat sessions
                    </p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Auto-assign Chats</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign new chats to available staff
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_assign}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, auto_assign: checked }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-foreground font-medium">Max Concurrent Chats</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Maximum number of active chats per staff member
                  </p>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.max_concurrent_chats}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        max_concurrent_chats: parseInt(e.target.value) || 1 
                      }))
                    }
                    className="bg-gaming-dark border-gaming-border w-32"
                  />
                </div>

                <Button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="bg-neon-teal hover:bg-neon-teal/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                <Users className="h-5 w-5 mr-2 text-neon-teal" />
                Chat Analytics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <div className="text-2xl font-bold text-neon-teal">{waitingChats}</div>
                  <div className="text-sm text-muted-foreground">Waiting for Response</div>
                </div>
                
                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{activeChats}</div>
                  <div className="text-sm text-muted-foreground">Active Chats</div>
                </div>
                
                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">0</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                
                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">0</div>
                  <div className="text-sm text-muted-foreground">Total Sessions Today</div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  More detailed analytics coming soon...
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LiveChatManager;