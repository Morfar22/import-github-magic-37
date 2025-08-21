import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  AlertTriangle,
  Users,
  Activity,
  Ban,
  Eye,
  Lock,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface SecurityStats {
  totalUsers: number;
  bannedUsers: number;
  activeUsers: number;
  failedLogins: number;
  auditLogs: number;
  blockedIPs: number;
}

interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  created_at: string;
  old_values?: any;
  new_values?: any;
  user_agent?: string;
}

interface FailedLogin {
  id: string;
  ip_address: string;
  email: string;
  attempt_count: number;
  first_attempt: string;
  last_attempt: string;
  blocked_until?: string;
  user_agent?: string;
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    bannedUsers: 0,
    activeUsers: 0,
    failedLogins: 0,
    auditLogs: 0,
    blockedIPs: 0
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch user stats
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, banned, created_at');

      if (usersError) throw usersError;

      // Fetch failed login attempts
      const { data: failedLoginData, error: failedLoginError } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(10);

      if (failedLoginError) throw failedLoginError;

      // Fetch audit logs
      const { data: auditLogData, error: auditLogError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (auditLogError) throw auditLogError;

      // Calculate stats
      const totalUsers = users?.length || 0;
      const bannedUsers = users?.filter(u => u.banned).length || 0;
      const activeUsers = totalUsers - bannedUsers;
      const blockedIPs = failedLoginData?.filter(f => f.blocked_until && new Date(f.blocked_until) > new Date()).length || 0;

      setStats({
        totalUsers,
        bannedUsers,
        activeUsers,
        failedLogins: failedLoginData?.length || 0,
        auditLogs: auditLogData?.length || 0,
        blockedIPs
      });

      setFailedLogins(failedLoginData?.map(item => ({
        ...item,
        ip_address: String(item.ip_address)
      })) || []);
      setAuditLogs(auditLogData?.map(item => ({
        ...item,
        ip_address: String(item.ip_address || '')
      })) || []);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unblockIP = async (ip: string) => {
    try {
      const { error } = await supabase
        .from('failed_login_attempts')
        .update({ blocked_until: null })
        .eq('ip_address', ip);

      if (error) throw error;

      toast({
        title: "Success",
        description: `IP ${ip} has been unblocked`,
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error unblocking IP:', error);
      toast({
        title: "Error",
        description: "Failed to unblock IP",
        variant: "destructive",
      });
    }
  };

  const blockIP = async (ip: string) => {
    try {
      const blockUntil = new Date();
      blockUntil.setHours(blockUntil.getHours() + 24); // Block for 24 hours

      const { error } = await supabase
        .from('failed_login_attempts')
        .upsert({
          ip_address: ip,
          attempt_count: 999,
          first_attempt: new Date().toISOString(),
          last_attempt: new Date().toISOString(),
          blocked_until: blockUntil.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `IP ${ip} has been blocked for 24 hours`,
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast({
        title: "Error",
        description: "Failed to block IP",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'ban':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'update':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isIPBlocked = (item: FailedLogin) => {
    return item.blocked_until && new Date(item.blocked_until) > new Date();
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                {stats.activeUsers} active
              </Badge>
              <Badge variant="destructive" className="text-xs ml-2">
                {stats.bannedUsers} banned
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.failedLogins}</div>
            <div className="flex items-center mt-2">
              <Badge variant="destructive" className="text-xs">
                {stats.blockedIPs} IPs blocked
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">85%</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-muted-foreground">Good security</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gaming-card">
          <TabsTrigger value="audit" className="data-[state=active]:bg-primary">
            <Activity className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="failed-logins" className="data-[state=active]:bg-primary">
            <AlertCircle className="h-4 w-4 mr-2" />
            Failed Logins
          </TabsTrigger>
          <TabsTrigger value="security-health" className="data-[state=active]:bg-primary">
            <Shield className="h-4 w-4 mr-2" />
            Security Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No audit logs found</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border border-gaming-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getActionIcon(log.action)}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {log.action} on {log.resource_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            IP: {log.ip_address} • {formatDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {log.resource_type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed-logins" className="space-y-4">
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Failed Login Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failedLogins.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No failed login attempts</p>
                ) : (
                  failedLogins.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border border-gaming-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {attempt.ip_address} ({attempt.attempt_count} attempts)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.email && `Email: ${attempt.email} • `}
                            Last: {formatDate(attempt.last_attempt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isIPBlocked(attempt) ? (
                          <>
                            <Badge variant="destructive" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Blocked
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unblockIP(attempt.ip_address)}
                            >
                              Unblock
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => blockIP(attempt.ip_address)}
                          >
                            Block IP
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security-health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gaming-card border-gaming-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Active Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Authentication</span>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit Logging</span>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">IP Blocking</span>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gaming-card border-gaming-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Last security scan: <span className="text-foreground">2 hours ago</span>
                  </p>
                  <p className="text-muted-foreground">
                    Failed logins today: <span className="text-foreground">{stats.failedLogins}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Active user sessions: <span className="text-foreground">{stats.activeUsers}</span>
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchSecurityData}
                    className="mt-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}