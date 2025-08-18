import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield } from 'lucide-react';

interface DiscordBotManagerProps {
  serverSettings: any;
  setServerSettings: (settings: any) => void;
  handleSettingUpdate: (key: string, value: any) => Promise<void>;
}

const DiscordBotManager = ({ 
  serverSettings, 
  setServerSettings, 
  handleSettingUpdate 
}: DiscordBotManagerProps) => {
  const { toast } = useToast();

  const handleVerifyDiscordBot = async () => {
    try {
      if (!serverSettings.discord_settings?.server_id) {
        toast({
          title: "Error",
          description: "Please enter Discord Server ID first",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('discord-bot', {
        body: {
          action: 'verify_bot_permissions',
          data: {
            guildId: serverSettings.discord_settings.server_id
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Bot Verification Successful",
          description: `Bot has ${data.data.hasManageRoles ? 'sufficient' : 'insufficient'} permissions for role management`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Discord bot verification error:', error);
      toast({
        title: "Bot Verification Failed",
        description: error.message || "Failed to verify Discord bot permissions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-foreground">Auto-Role Assignment</Label>
        <Switch
          checked={serverSettings.discord_settings?.auto_roles || false}
          onCheckedChange={(checked) => {
            const newSettings = {
              ...serverSettings.discord_settings,
              auto_roles: checked
            };
            setServerSettings({
              ...serverSettings,
              discord_settings: newSettings
            });
            handleSettingUpdate('discord_settings', newSettings);
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-foreground">Sync Discord Roles</Label>
        <Switch
          checked={serverSettings.discord_settings?.sync_roles || false}
          onCheckedChange={(checked) => {
            const newSettings = {
              ...serverSettings.discord_settings,
              sync_roles: checked
            };
            setServerSettings({
              ...serverSettings,
              discord_settings: newSettings
            });
            handleSettingUpdate('discord_settings', newSettings);
          }}
        />
      </div>

      {/* Role Mappings Section */}
      {serverSettings.discord_settings?.auto_roles && (
        <div className="space-y-4 bg-gaming-dark/50 p-4 rounded-lg border border-gaming-border">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-neon-blue" />
            <h3 className="font-semibold text-foreground">Discord Role Mappings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">User Role ID</Label>
              <Input
                placeholder="Discord role ID for approved users"
                value={serverSettings.discord_settings?.role_mappings?.user || ''}
                onChange={(e) => {
                  const newSettings = {
                    ...serverSettings.discord_settings,
                    role_mappings: {
                      ...serverSettings.discord_settings?.role_mappings,
                      user: e.target.value
                    }
                  };
                  setServerSettings({
                    ...serverSettings,
                    discord_settings: newSettings
                  });
                }}
                onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                className="bg-gaming-card border-gaming-border"
              />
            </div>
            
            <div>
              <Label className="text-foreground">Moderator Role ID</Label>
              <Input
                placeholder="Discord role ID for moderators"
                value={serverSettings.discord_settings?.role_mappings?.moderator || ''}
                onChange={(e) => {
                  const newSettings = {
                    ...serverSettings.discord_settings,
                    role_mappings: {
                      ...serverSettings.discord_settings?.role_mappings,
                      moderator: e.target.value
                    }
                  };
                  setServerSettings({
                    ...serverSettings,
                    discord_settings: newSettings
                  });
                }}
                onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                className="bg-gaming-card border-gaming-border"
              />
            </div>
            
            <div>
              <Label className="text-foreground">Admin Role ID</Label>
              <Input
                placeholder="Discord role ID for admins"
                value={serverSettings.discord_settings?.role_mappings?.admin || ''}
                onChange={(e) => {
                  const newSettings = {
                    ...serverSettings.discord_settings,
                    role_mappings: {
                      ...serverSettings.discord_settings?.role_mappings,
                      admin: e.target.value
                    }
                  };
                  setServerSettings({
                    ...serverSettings,
                    discord_settings: newSettings
                  });
                }}
                onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                className="bg-gaming-card border-gaming-border"
              />
            </div>
            
            <div>
              <Label className="text-foreground">Bot Verification</Label>
              <Button
                variant="outline"
                onClick={handleVerifyDiscordBot}
                disabled={!serverSettings.discord_settings?.server_id}
                className="w-full border-gaming-border hover:bg-gaming-dark"
              >
                <Shield className="h-4 w-4 mr-2" />
                Verify Bot Permissions
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded p-3">
            <strong>How to get Discord Role IDs:</strong><br />
            1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)<br />
            2. Right-click on any role in your server<br />
            3. Click "Copy Role ID"<br />
            4. Paste the ID in the corresponding field above
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscordBotManager;