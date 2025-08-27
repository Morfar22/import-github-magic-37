import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, Globe, Award, Edit2, Save } from "lucide-react";

const ServerInfoCard = () => {
  const [serverInfo, setServerInfo] = useState({
    displayIp: 'connect panel.adventurerp.dk:30120',
    discordUrl: '',
    status: 'online'
  });
  const [editingServerInfo, setEditingServerInfo] = useState({
    displayIp: '',
    discordUrl: '',
    status: 'online'
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchServerInfo();
  }, []);

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
          displayIp: settings.server_display_ip || 'connect panel.adventurerp.dk:30120 ',
          discordUrl: settings.discord_url || '',
          status: settings.server_status || 'online'
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleDiscordClick = () => {
    if (serverInfo.discordUrl) {
      window.open(serverInfo.discordUrl, '_blank');
    } else {
      toast({
        title: "Discord Link Not Available",
        description: "The Discord link has not been configured yet.",
        variant: "destructive",
      });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-neon-teal/20 text-neon-teal border-neon-teal/30';
      case 'maintenance':
        return 'bg-golden-light/20 text-golden-light border-golden-light/30';
      case 'offline':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-neon-teal/20 text-neon-teal border-neon-teal/30';
    }
  };

  const handleEditClick = () => {
    setEditingServerInfo({
      displayIp: serverInfo.displayIp,
      discordUrl: serverInfo.discordUrl,
      status: serverInfo.status
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Update server_display_ip
      const { error: ipError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'server_display_ip',
          setting_value: editingServerInfo.displayIp,
        });

      if (ipError) throw ipError;

      // Update discord_url
      const { error: discordError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'discord_url',
          setting_value: editingServerInfo.discordUrl,
        });

      if (discordError) throw discordError;

      // Update server_status
      const { error: statusError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'server_status',
          setting_value: editingServerInfo.status,
        });

      if (statusError) throw statusError;

      setServerInfo(editingServerInfo);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Server Info Updated",
        description: "Server information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating server info:', error);
      toast({
        title: "Error",
        description: "Failed to update server information.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="group p-8 bg-gaming-card/80 backdrop-blur-sm border-2 border-gaming-border hover:border-teal-primary hover:bg-gaming-card transition-all duration-300 hover:shadow-lg hover:shadow-teal-primary/30">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <h3 className="text-2xl font-bold text-foreground font-orbitron flex items-center group-hover:text-teal-primary transition-colors duration-300">
              <Gamepad2 className="h-6 w-6 mr-2 text-teal-primary group-hover:scale-110 transition-transform duration-300" />
              SERVER INFORMATION
            </h3>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-teal-primary hover:text-teal-light"
                  onClick={handleEditClick}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gaming-card border-gaming-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Server Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Server Display IP</Label>
                    <Input
                      value={editingServerInfo.displayIp}
                      onChange={(e) => setEditingServerInfo({
                        ...editingServerInfo,
                        displayIp: e.target.value
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                      placeholder="connect your-server.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Discord URL</Label>
                    <Input
                      value={editingServerInfo.discordUrl}
                      onChange={(e) => setEditingServerInfo({
                        ...editingServerInfo,
                        discordUrl: e.target.value
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                      placeholder="https://discord.gg/your-server"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Server Status</Label>
                    <Select
                      value={editingServerInfo.status}
                      onValueChange={(value) => setEditingServerInfo({
                        ...editingServerInfo,
                        status: value
                      })}
                    >
                      <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-card border-gaming-border">
                        <SelectItem value="online" className="text-foreground hover:bg-gaming-dark">Online</SelectItem>
                        <SelectItem value="maintenance" className="text-foreground hover:bg-gaming-dark">Maintenance</SelectItem>
                        <SelectItem value="offline" className="text-foreground hover:bg-gaming-dark">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="border-gaming-border text-foreground hover:bg-gaming-dark"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="bg-teal-primary hover:bg-teal-light text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
            <span className="text-muted-foreground font-inter">Server IP:</span>
            <code className="bg-gaming-dark px-4 py-2 rounded font-mono text-teal-primary border border-teal-primary/30">
              {serverInfo.displayIp}
            </code>
          </div>
          <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
            <span className="text-muted-foreground font-inter">Discord:</span>
            <Button 
              variant="neon" 
              size="sm"
              className="font-orbitron bg-gradient-to-r from-teal-primary to-teal-light hover:from-teal-light hover:to-teal-primary border-2 border-teal-primary/50 hover:border-teal-primary text-white hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-teal-primary/50"
              onClick={handleDiscordClick}
              disabled={!serverInfo.discordUrl}
            >
              <Globe className="h-4 w-4 mr-2" />
              JOIN DISCORD
            </Button>
          </div>
          <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
            <span className="text-muted-foreground font-inter">Status:</span>
            <Badge className={`${getStatusStyle(serverInfo.status)} font-orbitron px-4 py-2`}>
              <Award className="h-3 w-3 mr-1" />
              {serverInfo.status.toUpperCase()}
            </Badge>
          </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ServerInfoCard;