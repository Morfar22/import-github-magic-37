import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Shield } from 'lucide-react';

interface IPWhitelistManagerProps {
  serverSettings: any;
  setServerSettings: (settings: any) => void;
  handleSettingUpdate: (key: string, value: any) => Promise<void>;
}

const IPWhitelistManager = ({ 
  serverSettings, 
  setServerSettings, 
  handleSettingUpdate 
}: IPWhitelistManagerProps) => {
  const [newIPAddress, setNewIPAddress] = useState("");
  const { toast } = useToast();

  const isValidIPAddress = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip.trim());
  };

  const handleAddIPAddress = async () => {
    const trimmedIP = newIPAddress.trim();
    
    if (!trimmedIP) {
      toast({
        title: "Error",
        description: "Please enter an IP address",
        variant: "destructive",
      });
      return;
    }

    if (!isValidIPAddress(trimmedIP)) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IP address (e.g., 192.168.1.1)",
        variant: "destructive",
      });
      return;
    }

    const currentIPs = serverSettings.security_settings?.whitelisted_ips || [];
    
    if (currentIPs.includes(trimmedIP)) {
      toast({
        title: "Duplicate IP Address",
        description: "This IP address is already in the whitelist",
        variant: "destructive",
      });
      return;
    }

    const newSettings = {
      ...serverSettings.security_settings,
      ip_whitelist: true,
      whitelisted_ips: [...currentIPs, trimmedIP]
    };

    setServerSettings({
      ...serverSettings,
      security_settings: newSettings
    });

    await handleSettingUpdate('security_settings', newSettings);
    setNewIPAddress("");
    
    toast({
      title: "Success",
      description: `IP address ${trimmedIP} added to whitelist`,
    });
  };

  const handleRemoveIPAddress = async (index: number) => {
    const currentIPs = serverSettings.security_settings?.whitelisted_ips || [];
    const removedIP = currentIPs[index];
    const newIPs = currentIPs.filter((_: any, i: number) => i !== index);

    const newSettings = {
      ...serverSettings.security_settings,
      whitelisted_ips: newIPs
    };

    setServerSettings({
      ...serverSettings,
      security_settings: newSettings
    });

    await handleSettingUpdate('security_settings', newSettings);
    
    toast({
      title: "Success",
      description: `IP address ${removedIP} removed from whitelist`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-foreground">Enable IP Whitelist</Label>
        <Switch
          checked={serverSettings.security_settings?.ip_whitelist || false}
          onCheckedChange={(checked) => {
            const newSettings = {
              ...serverSettings.security_settings,
              ip_whitelist: checked,
              whitelisted_ips: serverSettings.security_settings?.whitelisted_ips || []
            };
            setServerSettings({
              ...serverSettings,
              security_settings: newSettings
            });
            handleSettingUpdate('security_settings', newSettings);
          }}
        />
      </div>

      {serverSettings.security_settings?.ip_whitelist && (
        <div className="space-y-4 bg-gaming-dark/50 p-4 rounded-lg border border-gaming-border">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-neon-blue" />
            <h3 className="font-semibold text-foreground">Whitelisted IP Addresses</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={newIPAddress}
                onChange={(e) => setNewIPAddress(e.target.value)}
                className="flex-1 bg-gaming-card border-gaming-border"
              />
              <Button
                onClick={handleAddIPAddress}
                disabled={!newIPAddress.trim()}
                className="bg-neon-green hover:bg-neon-green/80 text-gaming-darker"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add IP
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(serverSettings.security_settings?.whitelisted_ips || []).map((ip: string, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gaming-card p-3 rounded border border-gaming-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    <code className="text-neon-purple text-sm">{ip}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveIPAddress(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {(!serverSettings.security_settings?.whitelisted_ips || serverSettings.security_settings.whitelisted_ips.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No IP addresses whitelisted</p>
                  <p className="text-sm">Add IP addresses to restrict access</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
            <strong>Warning:</strong> IP whitelist restricts access to only the specified IP addresses. 
            Make sure to add your current IP address before enabling to avoid being locked out.
          </div>
        </div>
      )}
    </div>
  );
};

export default IPWhitelistManager;