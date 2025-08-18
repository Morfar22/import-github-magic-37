import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const Apply = () => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [rulesAgreed, setRulesAgreed] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [selectedApplicationType, setSelectedApplicationType] = useState<any>(null);
  const [serverSettings, setServerSettings] = useState<any>({});
  const [error, setError] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchApplicationTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('application_types')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApplicationTypes(data || []);
        
        // Auto-select first type if only one exists
        if (data && data.length === 1) {
          setSelectedApplicationType(data[0]);
          // Initialize form data based on the application type fields
          const initialFormData: Record<string, any> = {};
          const formFields = data[0].form_fields as any[];
          formFields?.forEach((field: any) => {
            initialFormData[field.id] = field.type === 'number' ? 0 : '';
          });
          setFormData(initialFormData);
        }
      } catch (error) {
        console.error('Error fetching application types:', error);
      }
    };

    fetchApplicationTypes();
    fetchServerSettings();
    checkExistingApplication();
    fetchAllUserApplications();

    // Set up real-time subscription for application types
    const applicationTypesSubscription = supabase
      .channel('application_types_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'application_types'
        },
        () => {
          fetchApplicationTypes();
        }
      )
      .subscribe();

    return () => {
      applicationTypesSubscription.unsubscribe();
    };
  }, [user]);

  const fetchServerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('*');

      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });
      setServerSettings(settings);
    } catch (error) {
      console.error('Error fetching server settings:', error);
    }
  };

  const checkExistingApplication = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking application:', error);
        return;
      }

      // Only set existing application if multiple applications are not allowed
      // and the user has an approved application
      if (data && (!serverSettings.application_settings?.multiple_applications_allowed && data.status === 'approved')) {
        setExistingApplication(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllUserApplications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          application_types (
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      setAllApplications(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleApplicationTypeChange = (applicationTypeId: string) => {
    const selectedType = applicationTypes.find(type => type.id === applicationTypeId);
    if (selectedType) {
      setSelectedApplicationType(selectedType);
      // Reset form data based on new application type
      const newFormData: Record<string, any> = {};
      const formFields = selectedType.form_fields as any[];
      formFields?.forEach((field: any) => {
        newFormData[field.id] = field.type === 'number' ? 0 : '';
      });
      setFormData(newFormData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!selectedApplicationType) {
      setError("Please select an application type");
      setIsLoading(false);
      return;
    }

    if (!user) {
      setError("You must be logged in to submit an application");
      setIsLoading(false);
      return;
    }

    try {
      // Build the application data dynamically based on the form fields
      const applicationData: any = {
        user_id: user.id,
        application_type_id: selectedApplicationType.id,
        form_data: formData, // Store all form data as JSON
      };

      // Map standard form fields to database columns if they exist
      const submitFormFields = selectedApplicationType.form_fields as any[];
      submitFormFields?.forEach((field: any) => {
        const fieldValue = formData[field.id] || '';
        
        // Map field labels to database columns for standard fields
        switch (field.label?.toLowerCase()) {
          case 'steam name':
          case 'steam username':
            applicationData.steam_name = fieldValue;
            break;
          case 'discord tag':
          case 'discord username':
            applicationData.discord_tag = fieldValue;
            break;
          case 'discord name':
            applicationData.discord_name = fieldValue;
            break;
          case 'fivem name':
          case 'fivem username':
            applicationData.fivem_name = fieldValue;
            break;
          case 'age':
            applicationData.age = parseInt(fieldValue) || null;
            break;
          case 'character backstory':
          case 'backstory':
            applicationData.character_backstory = fieldValue;
            break;
          case 'rp experience':
          case 'roleplay experience':
          case 'experience':
            applicationData.rp_experience = fieldValue;
            break;
        }
      });

      const { data, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Send submission email - use form data with fallbacks
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            type: 'submission',
            userEmail: user.email,
            applicationData: {
              steam_name: applicationData.steam_name || formData.steam_name || '',
              discord_tag: applicationData.discord_tag || formData.discord_tag || '',
              discord_name: applicationData.discord_name || formData.discord_name || '',
              fivem_name: applicationData.fivem_name || formData.fivem_name || ''
            }
          }
        });
        console.log('Submission email sent successfully');
      } catch (emailError) {
        console.error('Error sending submission email:', emailError);
        // Don't fail the whole operation if email fails
      }

      // Send Discord notification for new application
      try {
        await supabase.functions.invoke('discord-logger', {
          body: {
            type: 'application_submitted',
            data: {
              steam_name: applicationData.steam_name || formData.steam_name || '',
              discord_tag: applicationData.discord_tag || formData.discord_tag || '',
              discord_name: applicationData.discord_name || formData.discord_name || '',
              fivem_name: applicationData.fivem_name || formData.fivem_name || '',
              age: applicationData.age || parseInt(formData.age) || 0,
              form_data: formData // Include the complete form data for fallback
            }
          }
        });
        console.log('Discord notification attempted');
      } catch (discordError) {
        console.error('Discord notification failed:', discordError);
        // Don't fail the whole operation if Discord fails
      }

      setExistingApplication(data);
      fetchAllUserApplications(); // Refresh the applications list
      toast({
        title: "Application Submitted!",
        description: "Your whitelist application has been sent to our staff team. You'll receive an email notification when it's reviewed.",
      });

      // Reset form
      const resetFormData: Record<string, any> = {};
      const resetFormFields = selectedApplicationType.form_fields as any[];
      resetFormFields?.forEach((field: any) => {
        resetFormData[field.id] = field.type === 'number' ? 0 : '';
      });
      setFormData(resetFormData);
      setRulesAgreed(false);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      setError(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-neon-green" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-neon-blue" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-neon-green border-neon-green/30 bg-neon-green/10';
      case 'denied':
        return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'under_review':
        return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10';
      default:
        return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Whitelist Application
            </h1>
            <p className="text-muted-foreground">
              Join Dreamlight RP - The premier FiveM roleplay experience
            </p>
          </div>

          <Tabs defaultValue="apply" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="apply">Apply</TabsTrigger>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="apply" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                {/* Show existing application status if exists and multiple apps not allowed */}
                {existingApplication && !serverSettings.application_settings?.multiple_applications_allowed && (
                  <Card className="mb-6 p-6 bg-gaming-card border-gaming-border">
                    <div className="flex items-center space-x-3 mb-4">
                      {getStatusIcon(existingApplication.status)}
                      <h3 className="text-lg font-semibold text-foreground">Application Status</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(existingApplication.status)}`}>
                          {existingApplication.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="text-foreground">
                          {new Date(existingApplication.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {existingApplication.review_notes && (
                        <div className="mt-4 p-4 bg-gaming-dark rounded-lg border border-gaming-border">
                          <h4 className="font-medium text-foreground mb-2">Staff Notes:</h4>
                          <p className="text-muted-foreground">{existingApplication.review_notes}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Show form - allow multiple applications based on settings */}
                {(!existingApplication || 
                  existingApplication.status === 'denied' || 
                  serverSettings.application_settings?.multiple_applications_allowed) && (
                  <Card className="p-8 bg-gaming-card border-gaming-border shadow-gaming">
                    {error && (
                      <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Application Type Selector */}
                    {applicationTypes.length > 1 && (
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="application-type" className="text-foreground">Application Type</Label>
                        <Select value={selectedApplicationType?.id || ""} onValueChange={handleApplicationTypeChange}>
                          <SelectTrigger className="bg-gaming-dark border-gaming-border focus:border-neon-purple">
                            <SelectValue placeholder="Select an application type" />
                          </SelectTrigger>
                          <SelectContent className="bg-gaming-card border-gaming-border">
                            {applicationTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id} className="hover:bg-gaming-dark">
                                <div>
                                  <div className="font-medium">{type.name}</div>
                                  {type.description && (
                                    <div className="text-sm text-muted-foreground">{type.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!selectedApplicationType && applicationTypes.length > 1 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Please select an application type to continue</p>
                      </div>
                    )}

                    {selectedApplicationType && (
                      <>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {(selectedApplicationType?.form_fields as any[])?.map((field: any, index: number) => {
                            // Create unique field key to avoid conflicts with duplicate names
                            const fieldKey = `${field.id}_${index}`;
                            
                            return (
                              <div key={fieldKey} className="space-y-2">
                                <Label htmlFor={fieldKey} className="text-foreground">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                
                                {field.type === 'textarea' ? (
                                 <Textarea
                                    id={fieldKey}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                                    placeholder={field.placeholder || ''}
                                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple min-h-[100px]"
                                    required={field.required}
                                  />
                                ) : (
                                  <Input
                                    id={fieldKey}
                                    type={field.type}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                                    placeholder={field.placeholder || ''}
                                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                                    required={field.required}
                                    min={field.type === 'number' ? '16' : undefined}
                                  />
                                )}
                              </div>
                            );
                          })}

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="rulesAgreed"
                              checked={rulesAgreed}
                              onChange={(e) => setRulesAgreed(e.target.checked)}
                              className="rounded border-gaming-border"
                              required
                            />
                            <Label htmlFor="rulesAgreed" className="text-sm">
                              I have read and agree to follow all server rules
                            </Label>
                          </div>

                          <Button 
                            type="submit" 
                            variant="hero" 
                            size="lg" 
                            className="w-full" 
                            disabled={isLoading || !selectedApplicationType}
                          >
                            {isLoading ? "Submitting..." : "Submit Application"}
                          </Button>
                        </form>
                      </>
                    )}
                  </Card>
                )}

                {existingApplication?.status === 'approved' && (
                  <Card className="p-6 bg-gaming-card border-gaming-border">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-neon-green mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">Application Approved!</h3>
                      <p className="text-muted-foreground mb-4">
                        Congratulations! Your application has been approved. You can now join the server.
                      </p>
                      <Button variant="neon" size="lg">
                        Join Server
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              <Card className="p-6 bg-gaming-card border-gaming-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">My Applications</h3>
                {allApplications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No applications found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application Type</TableHead>
                        <TableHead>Character Info</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">
                            {application.application_types?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {application.steam_name && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Steam:</span> {application.steam_name}
                                </div>
                              )}
                              {application.discord_name && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Discord:</span> {application.discord_name}
                                </div>
                              )}
                              {application.fivem_name && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">FiveM:</span> {application.fivem_name}
                                </div>
                              )}
                              {!application.steam_name && !application.discord_name && !application.fivem_name && (
                                <div className="text-sm text-muted-foreground">No character info</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(application.status)}
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(application.status)}`}>
                                {application.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {application.review_notes ? (
                              <div className="max-w-xs truncate" title={application.review_notes}>
                                {application.review_notes}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Apply;