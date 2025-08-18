import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, ShieldCheck, ShieldAlert, Lock, Users, Key, Globe, AlertTriangle } from "lucide-react";

interface SecurityOverviewProps {
  serverSettings: any;
  staffCount: number;
  userCount?: number;
}

export const SecurityOverview = ({ serverSettings, staffCount, userCount = 0 }: SecurityOverviewProps) => {
  const securitySettings = serverSettings.security_settings || {};
  const generalSettings = serverSettings.general_settings || {};
  const discordSettings = serverSettings.discord_integration || {};
  
  // Calculate security score
  const securityChecks = [
    { name: "IP Whitelist", enabled: securitySettings.ip_whitelist, weight: 25 },
    { name: "Maintenance Mode", enabled: generalSettings.maintenance_mode, weight: 15 },
    { name: "Discord Integration", enabled: discordSettings.bot_token, weight: 20 },
    { name: "Staff Access Control", enabled: staffCount > 0, weight: 20 },
    { name: "Application Screening", enabled: serverSettings.application_settings?.accept_applications, weight: 20 }
  ];
  
  const enabledChecks = securityChecks.filter(check => check.enabled);
  const securityScore = enabledChecks.reduce((total, check) => total + check.weight, 0);
  
  const getSecurityLevel = () => {
    if (securityScore >= 80) return { level: "High", color: "text-green-400", icon: ShieldCheck };
    if (securityScore >= 50) return { level: "Medium", color: "text-yellow-400", icon: Shield };
    return { level: "Low", color: "text-red-400", icon: ShieldAlert };
  };
  
  const security = getSecurityLevel();
  const SecurityIcon = security.icon;

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SecurityIcon className={`h-5 w-5 ${security.color}`} />
            <h3 className="font-semibold text-foreground">Security Overview</h3>
          </div>
          <Badge variant={security.level === "High" ? "default" : security.level === "Medium" ? "secondary" : "destructive"}>
            {security.level} Security
          </Badge>
        </div>

        {/* Security Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Security Score</span>
            <span className={`font-medium ${security.color}`}>{securityScore}/100</span>
          </div>
          <Progress value={securityScore} className="h-2" />
        </div>

        {/* Active Security Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Active Features</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* IP Whitelist */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${securitySettings.ip_whitelist ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">IP Whitelist</span>
            </div>
            
            {/* Maintenance Mode */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${generalSettings.maintenance_mode ? 'bg-yellow-400' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">Maintenance</span>
            </div>
            
            {/* Discord Integration */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${discordSettings.bot_token ? 'bg-blue-400' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">Discord Bot</span>
            </div>
            
            {/* Staff Control */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${staffCount > 0 ? 'bg-purple-400' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">Staff Control</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gaming-border">
          <div className="text-center">
            <Lock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Protected IPs</p>
            <p className="text-sm font-medium text-foreground">
              {securitySettings.ip_whitelist ? (securitySettings.whitelisted_ips?.length || 0) : 'Disabled'}
            </p>
          </div>
          
          <div className="text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Staff Members</p>
            <p className="text-sm font-medium text-foreground">{staffCount}</p>
          </div>
          
          <div className="text-center">
            <Key className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Access Level</p>
            <p className="text-sm font-medium text-foreground">
              {generalSettings.maintenance_mode ? 'Staff Only' : 'Public'}
            </p>
          </div>
        </div>

        {/* Security Recommendations */}
        {securityScore < 80 && (
          <div className="pt-3 border-t border-gaming-border">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">Security Recommendations</span>
            </div>
            <div className="space-y-1">
              {!securitySettings.ip_whitelist && (
                <p className="text-xs text-muted-foreground">• Enable IP whitelist for enhanced protection</p>
              )}
              {!discordSettings.bot_token && (
                <p className="text-xs text-muted-foreground">• Setup Discord integration for monitoring</p>
              )}
              {staffCount === 0 && (
                <p className="text-xs text-muted-foreground">• Assign staff members for moderation</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};