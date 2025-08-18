import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle, XCircle, Clock, Trash2, Webhook, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ApplicationTypesManager from "./ApplicationTypesManager";

const ApplicationSettingsPanel = () => {
  const [applicationSettings, setApplicationSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplicationSettings();
  }, []);

  const fetchApplicationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'application_settings')
        .maybeSingle();

      if (error) throw error;
      setApplicationSettings(data?.setting_value || {});
    } catch (error) {
      console.error('Error fetching application settings:', error);
    }
  };

  const updateApplicationSettings = async (settings: any) => {
    setLoadingSettings(true);
    try {
      // Check if record exists first
      const { data: existingData } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'application_settings')
        .maybeSingle();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: settings,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'application_settings');

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: 'application_settings',
            setting_value: settings,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }
      
      setApplicationSettings(settings);
      toast({
        title: "Settings Updated",
        description: "Application settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating application settings:', error);
      toast({
        title: "Error",
        description: "Failed to update application settings.",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-neon-purple" />
        <h2 className="text-xl font-semibold text-foreground">Application Settings</h2>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Multiple Applications</Label>
            <div className="text-sm text-muted-foreground">
              Allow users to submit multiple applications even if they have an approved one
            </div>
          </div>
          <Switch
            checked={applicationSettings.multiple_applications_allowed || false}
            onCheckedChange={(checked) => 
              updateApplicationSettings({
                ...applicationSettings,
                multiple_applications_allowed: checked
              })
            }
            disabled={loadingSettings}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Auto Close Applications</Label>
            <div className="text-sm text-muted-foreground">
              Automatically close applications after approval/rejection
            </div>
          </div>
          <Switch
            checked={applicationSettings.auto_close_applications || false}
            onCheckedChange={(checked) => 
              updateApplicationSettings({
                ...applicationSettings,
                auto_close_applications: checked
              })
            }
            disabled={loadingSettings}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Require Age Verification</Label>
            <div className="text-sm text-muted-foreground">
              Require users to verify they are 18+ before applying
            </div>
          </div>
          <Switch
            checked={applicationSettings.require_age_verification || false}
            onCheckedChange={(checked) => 
              updateApplicationSettings({
                ...applicationSettings,
                require_age_verification: checked
              })
            }
            disabled={loadingSettings}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base text-foreground">Application Cooldown (Days)</Label>
          <div className="text-sm text-muted-foreground mb-2">
            How long users must wait before reapplying after rejection
          </div>
          <Input
            type="number"
            min="0"
            max="365"
            value={applicationSettings.cooldown_days || 0}
            onChange={(e) => 
              updateApplicationSettings({
                ...applicationSettings,
                cooldown_days: parseInt(e.target.value) || 0
              })
            }
            disabled={loadingSettings}
            className="w-32 bg-gaming-dark border-gaming-border text-foreground"
          />
        </div>
      </div>
    </Card>
  );
};

const ApplicationManager = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [discordSettings, setDiscordSettings] = useState<any>({
    enabled: false,
    staff_webhook_url: "",
    public_webhook_url: "",
    notify_submissions: true,
    notify_approvals: true,
    notify_denials: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
    fetchDiscordSettings();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscordSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'application_discord_settings')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.setting_value) {
        setDiscordSettings(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching Discord settings:', error);
    }
  };

  const updateDiscordSettings = async (newSettings: any) => {
    try {
      const { data: existingData } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'application_discord_settings')
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'application_discord_settings');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: 'application_discord_settings',
            setting_value: newSettings,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }

      setDiscordSettings(newSettings);
      toast({
        title: "Success",
        description: "Discord settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating Discord settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Discord settings",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      // Get the application data first for notifications
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('applications')
        .update({
          status,
          review_notes: notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Send email notification
      try {
        // Get user email from profiles table
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', appData.user_id)
          .single();

        if (profileError) throw profileError;

        if (userProfile?.email) {
          await supabase.functions.invoke('send-application-email', {
            body: {
              type: status === 'approved' ? 'approved' : status === 'rejected' ? 'denied' : 'under_review',
              userEmail: userProfile.email,
              applicationData: {
                steam_name: appData.steam_name || '',
                discord_tag: appData.discord_tag || '',
                discord_name: appData.discord_name || '',
                fivem_name: appData.fivem_name || '',
                review_notes: notes || '',
                status: status
              }
            }
          });
          console.log('Status update email sent successfully');
        } else {
          console.log('No email found for user');
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
      }

      // Send Discord notification
      try {
        const discordType = status === 'approved' ? 'application_approved' : 
                          status === 'rejected' ? 'application_denied' : 
                          'application_under_review';
        
        await supabase.functions.invoke('discord-logger', {
          body: {
            type: discordType,
            data: {
              steam_name: appData.steam_name || '',
              discord_tag: appData.discord_tag || '',
              discord_name: appData.discord_name || '',
              fivem_name: appData.fivem_name || '',
              review_notes: notes || '',
              form_data: appData.form_data || {} // Include the form_data for fallback
            }
          }
        });
        console.log('Discord notification sent successfully');
      } catch (discordError) {
        console.error('Error sending Discord notification:', discordError);
      }

      await fetchApplications();
      toast({
        title: "Success",
        description: `Application ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      await fetchApplications();
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading applications...</p>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="applications" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-gaming-card border-gaming-border">
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="discord">Discord Settings</TabsTrigger>
        <TabsTrigger value="types">Application Types</TabsTrigger>
      </TabsList>

      <TabsContent value="applications">
        <ApplicationsList 
          applications={applications}
          updateApplicationStatus={updateApplicationStatus}
          deleteApplication={deleteApplication}
          getStatusColor={getStatusColor}
        />
      </TabsContent>

      <TabsContent value="settings">
        <ApplicationSettingsPanel />
      </TabsContent>

      <TabsContent value="discord">
        <DiscordSettingsPanel 
          settings={discordSettings}
          onUpdate={updateDiscordSettings}
        />
      </TabsContent>

      <TabsContent value="types">
        <ApplicationTypesManager />
      </TabsContent>
    </Tabs>
  );
};

const ApplicationsList = ({ applications, updateApplicationStatus, deleteApplication, getStatusColor }: any) => {
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Application Management</h2>
        <Badge variant="outline" className="text-foreground">
          {applications.length} Total Applications
        </Badge>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No applications found</p>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-4 bg-gaming-dark border-gaming-border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-foreground">{app.steam_name || 'Unknown User'}</h3>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Discord: {app.discord_name} • Steam: {app.steam_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gaming-card border-gaming-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Application Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Review application from {selectedApp?.steam_name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedApp && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-foreground">Steam Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.steam_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Discord Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.discord_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Steam Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.steam_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">FiveM Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.fivem_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Age</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.age}</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-foreground">Character Backstory</Label>
                            <p className="text-sm text-muted-foreground mt-1 p-3 bg-gaming-dark rounded border">
                              {selectedApp.character_backstory}
                            </p>
                          </div>
                          
                          <div>
                            <Label className="text-foreground">RP Experience</Label>
                            <p className="text-sm text-muted-foreground mt-1 p-3 bg-gaming-dark rounded border">
                              {selectedApp.rp_experience}
                            </p>
                          </div>

                          {selectedApp.review_notes && (
                            <div>
                              <Label className="text-foreground">Review Notes</Label>
                              <p className="text-sm text-muted-foreground mt-1 p-3 bg-gaming-dark rounded border">
                                {selectedApp.review_notes}
                              </p>
                            </div>
                          )}

                          {selectedApp.status === 'pending' && (
                            <div className="space-y-2">
                              <Label className="text-foreground">Review Notes</Label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add review notes..."
                                className="bg-gaming-dark border-gaming-border text-foreground"
                              />
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            {selectedApp.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => {
                                    updateApplicationStatus(selectedApp.id, 'approved', reviewNotes);
                                    setReviewNotes("");
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => {
                                    console.log('Reject button clicked for application:', selectedApp.id);
                                    updateApplicationStatus(selectedApp.id, 'rejected', reviewNotes);
                                    setReviewNotes("");
                                  }}
                                  variant="destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gaming-card border-gaming-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Application</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete this application? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteApplication(app.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};

const DiscordSettingsPanel = ({ settings, onUpdate }: any) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      [key]: value
    });
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center space-x-3 mb-6">
        <Webhook className="h-6 w-6 text-neon-purple" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Application Discord Notifications</h2>
          <p className="text-sm text-muted-foreground">Configure Discord webhooks for application management (Staff Channel)</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-foreground">Enable Application Notifications</Label>
            <p className="text-sm text-muted-foreground">Send application notifications to your staff Discord channel</p>
            <p className="text-xs text-neon-purple">⚠️ Use a dedicated staff channel - contains sensitive application data</p>
          </div>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        {localSettings.enabled && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-webhook-url" className="text-foreground">Staff Discord Webhook URL</Label>
                <Input
                  id="staff-webhook-url"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/... (Staff Channel)"
                  value={localSettings.staff_webhook_url}
                  onChange={(e) => handleSettingChange('staff_webhook_url', e.target.value)}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  For new application submissions - Use a <strong>private staff channel</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="public-webhook-url" className="text-foreground">Public Discord Webhook URL</Label>
                <Input
                  id="public-webhook-url"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/... (Public Channel)"
                  value={localSettings.public_webhook_url}
                  onChange={(e) => handleSettingChange('public_webhook_url', e.target.value)}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  For approvals/denials - Can be a <strong>public channel</strong>
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400">
                  <strong>Setup Guide:</strong> Create webhooks in Discord → Server Settings → Integrations → Webhooks
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <Label className="text-foreground font-medium flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-neon-blue" />
                    <span>Staff Notifications</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">Internal notifications for staff members only</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">New Application Submissions</Label>
                      <p className="text-sm text-muted-foreground">Notify staff when new applications are submitted</p>
                      <p className="text-xs text-neon-blue">📨 Sent to: <strong>Staff Webhook</strong> (Private)</p>
                    </div>
                    <Switch
                      checked={localSettings.notify_submissions}
                      onCheckedChange={(checked) => handleSettingChange('notify_submissions', checked)}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <Label className="text-foreground font-medium flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-neon-green" />
                    <span>Application Status Updates</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">Notifications when applications are processed</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Application Approvals</Label>
                        <p className="text-sm text-muted-foreground">Notify when applications are approved</p>
                        <p className="text-xs text-neon-green">📢 Sent to: <strong>Public Webhook</strong> (Community)</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_approvals}
                        onCheckedChange={(checked) => handleSettingChange('notify_approvals', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Application Denials</Label>
                        <p className="text-sm text-muted-foreground">Notify when applications are denied</p>
                        <p className="text-xs text-red-400">📢 Sent to: <strong>Public Webhook</strong> (Community)</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_denials}
                        onCheckedChange={(checked) => handleSettingChange('notify_denials', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gaming-border">
              <Button onClick={handleSave} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Discord Settings
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default ApplicationManager;