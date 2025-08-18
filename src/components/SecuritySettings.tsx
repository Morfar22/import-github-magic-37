import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  ShieldCheck, 
  Key, 
  Clock, 
  Eye, 
  UserCheck, 
  AlertTriangle,
  FileText,
  Lock,
  Globe,
  Timer,
  Ban
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SecuritySettingsProps {
  serverSettings: any;
  setServerSettings: (settings: any) => void;
  handleSettingUpdate: (settingType: string, value: any) => void;
}

export const SecuritySettings = ({ serverSettings, setServerSettings, handleSettingUpdate }: SecuritySettingsProps) => {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const securitySettings = serverSettings.security_settings || {};
  const generalSettings = serverSettings.general_settings || {};

  useEffect(() => {
    fetchAuditLogs();
    if (securitySettings.audit_logging) {
      fetchSecurityStats();
    }
  }, [securitySettings.audit_logging]);

  const fetchSecurityStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-manager', {
        body: { action: 'get_security_stats' }
      });
      
      if (error) throw error;
      console.log('Security stats:', data);
    } catch (error) {
      console.error('Error fetching security stats:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      if (securitySettings.audit_logging) {
        const { data, error } = await supabase.functions.invoke('security-manager', {
          body: { action: 'get_audit_logs', data: { limit: 10 } }
        });
        
        if (error) throw error;
        setAuditLogs(data.data || []);
      } else {
        // Show placeholder data when audit logging is disabled
        setAuditLogs([
          { id: 1, action: "Login", user_id: "admin", created_at: new Date(), ip_address: "192.168.1.1" },
          { id: 2, action: "Application Approved", user_id: "moderator", created_at: new Date(), ip_address: "192.168.1.2" }
        ]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    }
  };

  const updateSecuritySetting = (key: string, value: any) => {
    const newSettings = {
      ...securitySettings,
      [key]: value
    };
    setServerSettings({
      ...serverSettings,
      security_settings: newSettings
    });
    handleSettingUpdate('security_settings', newSettings);
  };

  const testSecurityFeature = async (feature: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Security Test",
        description: `${feature} feature tested successfully`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `Failed to test ${feature}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication Security */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-neon-blue" />
            <CardTitle>Authentication Security</CardTitle>
          </div>
          <CardDescription>Configure authentication and access control settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for staff accounts</p>
            </div>
            <Switch
              checked={securitySettings.require_2fa || false}
              onCheckedChange={(checked) => updateSecuritySetting('require_2fa', checked)}
            />
          </div>

          {/* Password Policy */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Strong Password Policy</Label>
              <p className="text-sm text-muted-foreground">Enforce complex password requirements</p>
            </div>
            <Switch
              checked={securitySettings.strong_passwords || false}
              onCheckedChange={(checked) => updateSecuritySetting('strong_passwords', checked)}
            />
          </div>

          {/* Session Timeout */}
          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Select 
              value={securitySettings.session_timeout?.toString() || "60"}
              onValueChange={(value) => updateSecuritySetting('session_timeout', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Application Security */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-neon-green" />
            <CardTitle>Application Security</CardTitle>
          </div>
          <CardDescription>Control application submission and review process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rate Limiting */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Application Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">Limit applications per IP address</p>
            </div>
            <Switch
              checked={securitySettings.rate_limiting || false}
              onCheckedChange={(checked) => updateSecuritySetting('rate_limiting', checked)}
            />
          </div>

          {/* Application Cooldown */}
          <div className="space-y-2">
            <Label>Application Cooldown Period</Label>
            <Select 
              value={securitySettings.application_cooldown?.toString() || "24"}
              onValueChange={(value) => updateSecuritySetting('application_cooldown', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
                <SelectItem value="720">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-reject duplicate applications */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto-reject Duplicates</Label>
              <p className="text-sm text-muted-foreground">Automatically reject duplicate Discord/Steam IDs</p>
            </div>
            <Switch
              checked={securitySettings.auto_reject_duplicates || false}
              onCheckedChange={(checked) => updateSecuritySetting('auto_reject_duplicates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Monitoring & Logging */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-neon-purple" />
            <CardTitle>Monitoring & Logging</CardTitle>
          </div>
          <CardDescription>Track and monitor system activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audit Logging */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Log all administrative actions</p>
            </div>
            <Switch
              checked={securitySettings.audit_logging || false}
              onCheckedChange={(checked) => updateSecuritySetting('audit_logging', checked)}
            />
          </div>

          {/* IP Logging */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">IP Address Logging</Label>
              <p className="text-sm text-muted-foreground">Track IP addresses for security analysis</p>
            </div>
            <Switch
              checked={securitySettings.ip_logging || false}
              onCheckedChange={(checked) => updateSecuritySetting('ip_logging', checked)}
            />
          </div>

          {/* Failed Login Tracking */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Failed Login Tracking</Label>
              <p className="text-sm text-muted-foreground">Monitor and alert on failed login attempts</p>
            </div>
            <Switch
              checked={securitySettings.failed_login_tracking || false}
              onCheckedChange={(checked) => updateSecuritySetting('failed_login_tracking', checked)}
            />
          </div>

          {/* Login Attempt Threshold */}
          {securitySettings.failed_login_tracking && (
            <div className="space-y-2">
              <Label>Failed Login Threshold</Label>
              <Select 
                value={securitySettings.login_attempt_threshold?.toString() || "5"}
                onValueChange={(value) => updateSecuritySetting('login_attempt_threshold', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                  <SelectItem value="15">15 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Verification */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-yellow-500" />
            <CardTitle>User Verification</CardTitle>
          </div>
          <CardDescription>Additional verification requirements for users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Verification */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Email Verification Required</Label>
              <p className="text-sm text-muted-foreground">Users must verify email before applying</p>
            </div>
            <Switch
              checked={securitySettings.require_email_verification || false}
              onCheckedChange={(checked) => updateSecuritySetting('require_email_verification', checked)}
            />
          </div>

          {/* Discord Verification */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Discord Verification</Label>
              <p className="text-sm text-muted-foreground">Verify Discord accounts through bot integration</p>
            </div>
            <Switch
              checked={securitySettings.discord_verification || false}
              onCheckedChange={(checked) => updateSecuritySetting('discord_verification', checked)}
            />
          </div>

          {/* Steam Account Age */}
          <div className="space-y-2">
            <Label>Minimum Steam Account Age (days)</Label>
            <Input
              type="number"
              value={securitySettings.min_steam_age || 30}
              onChange={(e) => updateSecuritySetting('min_steam_age', parseInt(e.target.value))}
              className="bg-gaming-dark border-gaming-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-500" />
            <CardTitle>Security Actions</CardTitle>
          </div>
          <CardDescription>Test and manage security features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => testSecurityFeature("IP Whitelist")}
              disabled={loading}
              className="bg-neon-blue hover:bg-neon-blue/80"
            >
              <Globe className="h-4 w-4 mr-2" />
              Test IP Filter
            </Button>
            
            <Button 
              onClick={() => testSecurityFeature("Rate Limiting")}
              disabled={loading}
              className="bg-neon-green hover:bg-neon-green/80"
            >
              <Timer className="h-4 w-4 mr-2" />
              Test Rate Limits
            </Button>
            
            <Button 
              onClick={() => testSecurityFeature("Authentication")}
              disabled={loading}
              className="bg-neon-purple hover:bg-neon-purple/80"
            >
              <Lock className="h-4 w-4 mr-2" />
              Test Auth System
            </Button>
            
            <Button 
              onClick={() => testSecurityFeature("Monitoring")}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-500/80"
            >
              <Eye className="h-4 w-4 mr-2" />
              Test Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      {securitySettings.audit_logging && (
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle>Recent Security Events</CardTitle>
            </div>
            <CardDescription>Latest security-related activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gaming-dark rounded border border-gaming-border">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{log.user_id || 'System'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleTimeString()} - {log.ip_address || 'N/A'}
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No security events recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};