import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ApplicationForm = () => {
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchApplicationTypes();
      checkExistingApplication();
    }
  }, [user]);

  const fetchApplicationTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('application_types')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplicationTypes(data || []);
    } catch (error) {
      console.error('Error fetching application types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch application types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .single();

      if (data) {
        setHasExistingApplication(true);
      }
    } catch (error) {
      // No existing application found, which is fine
    }
  };

  const handleTypeSelect = (typeId: string) => {
    const type = applicationTypes.find(t => t.id === typeId);
    setSelectedType(type);
    
    // Initialize form data with empty values
    const initialData: any = {};
    type?.form_fields?.forEach((field: any) => {
      initialData[field.id] = '';
    });
    setFormData(initialData);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData({
      ...formData,
      [fieldId]: value
    });
  };

  const validateForm = () => {
    if (!selectedType) return false;
    
    for (const field of selectedType.form_fields) {
      if (field.required && !formData[field.id]?.trim()) {
        toast({
          title: "Validation Error",
          description: `${field.label} is required`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const submitApplication = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create the application record
      const applicationData = {
        user_id: user?.id,
        application_type_id: selectedType.id,
        status: 'pending',
        ...formData
      };

      const { error } = await supabase
        .from('applications')
        .insert(applicationData);

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            type: selectedType.name,
            userEmail: user?.email,
            applicationData: formData
          }
        });
        console.log('Submission email sent successfully');
      } catch (emailError) {
        console.error('Failed to send application email:', emailError);
        // Don't fail the whole process if email fails
      }

      // Send Discord notification
      try {
        console.log('Calling discord-logger function...');
        const discordResponse = await supabase.functions.invoke('discord-logger', {
          body: {
            type: 'application_submitted',
            data: {
              applicationId: 'pending', // We don't have the ID yet since this is after insert
              applicantEmail: user?.email,
              applicationType: selectedType.name,
              formData: formData
            }
          }
        });
        console.log('Discord function response:', discordResponse);
        console.log('Discord notification attempted');
      } catch (discordError) {
        console.error('Failed to send Discord notification:', discordError);
        // Don't fail the whole process if Discord fails
      }

      toast({
        title: "Success",
        description: "Your application has been submitted successfully!",
      });

      // Redirect to a success page or back to home
      navigate('/');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: any) => {
    const value = formData[field.id] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter your ${field.label.toLowerCase()}...`}
            className="bg-gaming-dark border-gaming-border text-foreground"
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter your ${field.label.toLowerCase()}...`}
            className="bg-gaming-dark border-gaming-border text-foreground"
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter your ${field.label.toLowerCase()}...`}
            className="bg-gaming-dark border-gaming-border text-foreground min-h-[120px]"
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent className="bg-gaming-card border-gaming-border">
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter your ${field.label.toLowerCase()}...`}
            className="bg-gaming-dark border-gaming-border text-foreground"
            required={field.required}
          />
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gaming-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to submit an application.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (hasExistingApplication) {
    return (
      <div className="min-h-screen bg-gaming-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You already have a pending application. Please wait for it to be reviewed.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Submit Application
            </h1>
            <p className="text-muted-foreground">
              Fill out the application form to join our community
            </p>
          </div>

          {isLoading ? (
            <Card className="p-8 bg-gaming-card border-gaming-border">
              <div className="text-center">
                <p className="text-foreground">Loading application types...</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Application Type Selection */}
              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-neon-blue" />
                  <h2 className="text-xl font-semibold text-foreground">Application Type</h2>
                </div>
                
                {applicationTypes.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No application types are currently available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {applicationTypes.map((type) => (
                      <div 
                        key={type.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedType?.id === type.id 
                            ? 'border-neon-blue bg-neon-blue/10' 
                            : 'border-gaming-border hover:border-gaming-border/60'
                        }`}
                        onClick={() => handleTypeSelect(type.id)}
                      >
                        <h3 className="font-medium text-foreground">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Application Form */}
              {selectedType && (
                <Card className="p-6 bg-gaming-card border-gaming-border">
                  <h2 className="text-xl font-semibold text-foreground mb-6">
                    {selectedType.name} Form
                  </h2>
                  
                  <div className="space-y-6">
                    {selectedType.form_fields?.map((field: any) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-foreground">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </Label>
                        {renderFormField(field)}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={submitApplication}
                      disabled={isSubmitting}
                      className="bg-neon-blue hover:bg-neon-blue/80"
                    >
                      {isSubmitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;