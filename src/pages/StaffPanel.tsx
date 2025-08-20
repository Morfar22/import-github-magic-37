import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useServerSettings } from "@/hooks/useServerSettings";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { 
  AlertCircle, 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Trash2, 
  Users, 
  Plus, 
  Edit, 
  Settings,
  RefreshCw,
  ChevronDown,
  GripVertical,
  EyeOff,
  Shield,
  X
} from "lucide-react";
import HomepageContentManager from "@/components/HomepageContentManager";
import ClosedApplications from "@/components/ClosedApplications";
import LogsViewer from "@/components/LogsViewer";
import DiscordBotManager from "@/components/DiscordBotManager";
import IPWhitelistManager from "@/components/IPWhitelistManager";
import ApplicationManager from "@/components/ApplicationManager";
import RulesManager from "@/components/RulesManager";
import StaffManager from "@/components/StaffManager";
import UserManagementSection from "@/components/UserManagementSection";
import TeamManager from "@/components/TeamManager";
import PartnerManager from "@/components/PartnerManager";
import NavbarManager from "@/components/NavbarManager";
import ServerStatsManager from "@/components/ServerStatsManager";
import { SecurityOverview } from "@/components/SecurityOverview";
import { SecuritySettings } from "@/components/SecuritySettings";
import { ApplicationsOverview } from "@/components/ApplicationsOverview";
import { StaffOverview } from "@/components/StaffOverview";
import { RulesOverview } from "@/components/RulesOverview";
import { PartnersOverview } from "@/components/PartnersOverview";
import { EmailTemplateManager } from "@/components/EmailTemplateManager";
import { DeploymentSettings } from "@/components/DeploymentSettings";

const DiscordLogsManager = () => {
  const [discordSettings, setDiscordSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiscordSettings();
  }, []);

  const fetchDiscordSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'discord_logging_settings')
        .maybeSingle();

      if (error) throw error;
      setDiscordSettings(data?.setting_value || {});
    } catch (error) {
      console.error('Error fetching Discord settings:', error);
    }
  };

  const updateDiscordSettings = async (settings: any) => {
    setLoadingSettings(true);
    try {
      // Check if record exists first
      const { data: existingData } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'discord_logging_settings')
        .maybeSingle();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: settings,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'discord_logging_settings');

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: 'discord_logging_settings',
            setting_value: settings,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }
      
      setDiscordSettings(settings);
      toast({
        title: "Settings Updated",
        description: "Discord logging settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating Discord settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Discord settings.",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const testDiscordLog = async (type: string) => {
    try {
      await supabase.functions.invoke('discord-logger', {
        body: {
          type,
          data: {
            staff_name: 'Test Staff',
            action: 'Test Action',
            target: 'Test Target',
            reason: 'Testing Discord logging system'
          }
        }
      });
      
      toast({
        title: "Test Sent",
        description: `Test ${type} log sent to Discord successfully.`,
      });
    } catch (error) {
      console.error('Error sending test log:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test log to Discord.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-neon-purple" />
        <h2 className="text-xl font-semibold text-foreground">Discord Logging Settings</h2>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-2">
            <Label className="text-foreground">Staff Webhook</Label>
            <Input
              value={discordSettings.staff_webhook || ''}
              onChange={(e) => setDiscordSettings({
                ...discordSettings,
                staff_webhook: e.target.value
              })}
              placeholder="Discord webhook URL for staff logs"
              className="bg-gaming-dark border-gaming-border text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground">Security Webhook</Label>
            <Input
              value={discordSettings.security_webhook || ''}
              onChange={(e) => setDiscordSettings({
                ...discordSettings,
                security_webhook: e.target.value
              })}
              placeholder="Discord webhook URL for security logs"
              className="bg-gaming-dark border-gaming-border text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground">General Webhook</Label>
            <Input
              value={discordSettings.general_webhook || ''}
              onChange={(e) => setDiscordSettings({
                ...discordSettings,
                general_webhook: e.target.value
              })}
              placeholder="Discord webhook URL for general logs"
              className="bg-gaming-dark border-gaming-border text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground">Errors Webhook</Label>
            <Input
              value={discordSettings.errors_webhook || ''}
              onChange={(e) => setDiscordSettings({
                ...discordSettings,
                errors_webhook: e.target.value
              })}
              placeholder="Discord webhook URL for error logs"
              className="bg-gaming-dark border-gaming-border text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gaming-border">
          <div className="flex space-x-2">
            <Button
              onClick={() => testDiscordLog('staff_action')}
              variant="outline"
              size="sm"
            >
              Test Staff Log
            </Button>
            <Button
              onClick={() => testDiscordLog('application_submitted')}
              variant="outline"
              size="sm"
            >
              Test Application Log
            </Button>
            <Button
              onClick={() => testDiscordLog('error_occurred')}
              variant="outline"
              size="sm"
            >
              Test Error Log
            </Button>
          </div>
          
          <Button
            onClick={() => updateDiscordSettings(discordSettings)}
            disabled={loadingSettings}
            className="bg-neon-purple hover:bg-neon-purple/80"
          >
            {loadingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const StaffPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [serverSettings, setServerSettings] = useState<any>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Basic state variables needed for functionality
  const [applications, setApplications] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Basic data fetching
      await Promise.all([
        fetchServerSettings(),
        fetchApplications(),
        fetchRules(),
        fetchStaffMembers(),
        fetchPartners()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('*');

      if (error) throw error;

      const settings: any = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });
      setServerSettings(settings);
    } catch (error) {
      console.error('Error fetching server settings:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'moderator']);

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const testEmail = async () => {
    const email = prompt("Enter email to test:");
    if (!email) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { testEmail: email }
      });
      
      if (error) throw error;
      toast({
        title: "Test Email Sent",
        description: `Email sent successfully to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Email Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testApplicationEmail = async () => {
    const email = prompt("Enter email to test application email:");
    if (!email) return;
    
    try {
      const testApplicationData = {
        steam_name: "Test Player",
        age: 25,
        discord_tag: "TestUser#1234",
        rp_experience: "Test RP experience",
        character_backstory: "This is a test character backstory"
      };

      const { data, error } = await supabase.functions.invoke('send-application-email', {
        body: { 
          type: 'rp',
          userEmail: email,
          applicationData: testApplicationData
        }
      });
      
      if (error) throw error;
      toast({
        title: "Application Email Test Sent",
        description: `Test application email sent successfully to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Application Email Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testSimpleFunction = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('simple-test', {
        body: { test: 'simple function test' }
      });
      
      if (error) throw error;
      toast({
        title: "Simple Test Success",
        description: `Function working! Has Resend key: ${data.environment?.hasResendKey}`,
      });
      console.log('Simple test response:', data);
    } catch (error: any) {
      toast({
        title: "Simple Test Failed",
        description: error.message,
        variant: "destructive"
      });
      console.error('Simple test error:', error);
    }
  };

  const testMinimalFunction = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('minimal-test');
      
      if (error) throw error;
      toast({
        title: "Minimal Test Success",
        description: "Basic edge function is working!",
      });
      console.log('Minimal test response:', data);
    } catch (error: any) {
      toast({
        title: "Minimal Test Failed",
        description: error.message,
        variant: "destructive"
      });
      console.error('Minimal test error:', error);
    }
  };

  const handleSettingUpdate = async (settingType: string, value: any) => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingType);

      if (error) throw error;

      // Update local state immediately
      setServerSettings({
        ...serverSettings,
        [settingType]: value
      });

      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error", 
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-purple" />
            <p className="text-foreground">Loading staff panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark staff-panel-scrollbar">
      <Navbar />
      
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Staff Panel
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your FiveM server settings, applications, and staff members
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 bg-gaming-card border-gaming-border min-w-fit">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="applications" className="text-xs sm:text-sm">Apps</TabsTrigger>
              <TabsTrigger value="rules" className="text-xs sm:text-sm">Rules</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs sm:text-sm">Staff</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
              <TabsTrigger value="team" className="text-xs sm:text-sm">Team</TabsTrigger>
              <TabsTrigger value="partners" className="text-xs sm:text-sm">Partners</TabsTrigger>
              <TabsTrigger value="navbar" className="text-xs sm:text-sm">Navbar</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm">Content</TabsTrigger>
              <TabsTrigger value="server-stats" className="text-xs sm:text-sm">Stats</TabsTrigger>
              <TabsTrigger value="deployment" className="text-xs sm:text-sm">Deploy</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs sm:text-sm">Logs</TabsTrigger>
              <TabsTrigger value="emails" className="text-xs sm:text-sm">Emails</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-6">
              <ApplicationsOverview applications={applications} />
              <StaffOverview staffMembers={staffMembers} />
              <RulesOverview rules={rules} />
              <PartnersOverview partners={partners} />
              <SecurityOverview 
                serverSettings={serverSettings} 
                staffCount={staffMembers.length}
              />
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4 sm:space-y-6">
            <ApplicationManager />
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 sm:space-y-6">
            <RulesManager />
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 sm:space-y-6">
            <StaffManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="team" className="space-y-4 sm:space-y-6">
            <TeamManager />
          </TabsContent>

          <TabsContent value="partners" className="space-y-4 sm:space-y-6">
            <PartnerManager />
          </TabsContent>

          <TabsContent value="navbar" className="space-y-4 sm:space-y-6">
            <NavbarManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            {/* Email Test */}
            <Card className="p-4 sm:p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <Settings className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Email Testing</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm sm:text-base">Test Email Function</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Test if your Resend API key is working correctly
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Button onClick={testMinimalFunction} variant="outline" size="sm">
                      Test Minimal Function
                    </Button>
                    <Button onClick={testSimpleFunction} variant="outline" size="sm">
                      Test Simple Function
                    </Button>
                    <Button onClick={testEmail} variant="outline" size="sm">
                      Test Basic Email
                    </Button>
                    <Button onClick={testApplicationEmail} variant="outline" size="sm">
                      Test Application Email
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* General Settings */}
            <Card className="p-4 sm:p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <Settings className="h-5 w-5 text-neon-purple" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">General Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm sm:text-base">Server Name</Label>
                  <Input
                    value={serverSettings.general_settings?.server_name || ''}
                    onChange={(e) => {
                      const newSettings = {
                        ...serverSettings.general_settings,
                        server_name: e.target.value
                      };
                      setServerSettings({
                        ...serverSettings,
                        general_settings: newSettings
                      });
                    }}
                    onBlur={() => handleSettingUpdate('general_settings', serverSettings.general_settings)}
                    placeholder="Enter your server name..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    This appears in the homepage hero section
                  </p>
                </div>

                <div>
                  <Label className="text-foreground text-sm sm:text-base">Welcome Message</Label>
                  <Textarea
                    value={serverSettings.general_settings?.welcome_message || ''}
                    onChange={(e) => {
                      const newSettings = {
                        ...serverSettings.general_settings,
                        welcome_message: e.target.value
                      };
                      setServerSettings({
                        ...serverSettings,
                        general_settings: newSettings
                      });
                    }}
                    onBlur={() => handleSettingUpdate('general_settings', serverSettings.general_settings)}
                    placeholder="Enter your welcome message..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                    rows={3}
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    This appears below the server name on the homepage
                  </p>
                </div>
              </div>
            </Card>

            {/* Maintenance Mode */}
            <Card className="p-4 sm:p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Maintenance Mode</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <Label className="text-foreground text-sm sm:text-base">Enable Maintenance Mode</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      When enabled, only staff can access the site
                    </p>
                  </div>
                  <Switch
                    checked={serverSettings.general_settings?.maintenance_mode || false}
                    onCheckedChange={(checked) => {
                      const newSettings = {
                        ...serverSettings.general_settings,
                        maintenance_mode: checked
                      };
                      setServerSettings({
                        ...serverSettings,
                        general_settings: newSettings
                      });
                      handleSettingUpdate('general_settings', newSettings);
                    }}
                  />
                </div>
                
                <div className="p-3 sm:p-4 bg-gaming-dark rounded border">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    <strong>Status:</strong> Maintenance mode is currently{' '}
                    <span className={serverSettings.general_settings?.maintenance_mode ? 'text-yellow-400' : 'text-green-400'}>
                      {serverSettings.general_settings?.maintenance_mode ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Application Settings */}
            <Card className="p-4 sm:p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <FileText className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Application Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <Label className="text-foreground text-sm sm:text-base">Accept Applications</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Toggle whether new applications can be submitted
                    </p>
                  </div>
                  <Switch
                    checked={serverSettings.application_settings?.accept_applications || false}
                    onCheckedChange={(checked) => {
                      const newSettings = {
                        ...serverSettings.application_settings,
                        accept_applications: checked
                      };
                      setServerSettings({
                        ...serverSettings,
                        application_settings: newSettings
                      });
                      handleSettingUpdate('application_settings', newSettings);
                    }}
                  />
                </div>
                
                <div className="p-3 sm:p-4 bg-gaming-dark rounded border">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    <strong>Status:</strong> Applications are currently{' '}
                    <span className={serverSettings.application_settings?.accept_applications ? 'text-green-400' : 'text-red-400'}>
                      {serverSettings.application_settings?.accept_applications ? 'OPEN' : 'CLOSED'}
                    </span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Discord Settings */}
            <Card className="p-4 sm:p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <Users className="h-5 w-5 text-neon-blue" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Discord Integration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm sm:text-base">Discord Server ID</Label>
                  <Input
                    value={serverSettings.discord_settings?.server_id || ''}
                    onChange={(e) => {
                      const newSettings = {
                        ...serverSettings.discord_settings,
                        server_id: e.target.value
                      };
                      setServerSettings({
                        ...serverSettings,
                        discord_settings: newSettings
                      });
                    }}
                    onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                    placeholder="Discord server ID..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>

                <DiscordBotManager 
                  serverSettings={serverSettings}
                  setServerSettings={setServerSettings}
                  handleSettingUpdate={handleSettingUpdate}
                />
              </div>
            </Card>

            {/* Security Settings */}
            <SecuritySettings 
              serverSettings={serverSettings}
              setServerSettings={setServerSettings}
              handleSettingUpdate={handleSettingUpdate}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-4 sm:space-y-6">
            <HomepageContentManager />
          </TabsContent>

          <TabsContent value="server-stats" className="space-y-4 sm:space-y-6">
            <ServerStatsManager />
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4 sm:space-y-6">
            <DeploymentSettings />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 sm:space-y-6">
            <DiscordLogsManager />
            <LogsViewer />
          </TabsContent>

          <TabsContent value="emails" className="space-y-4 sm:space-y-6">
            <EmailTemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffPanel;