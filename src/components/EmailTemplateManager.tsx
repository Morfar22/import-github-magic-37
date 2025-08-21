import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Save, Eye, AlertCircle } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const templateTypes = [
    { key: 'application_submitted', label: 'Application Submitted', description: 'Sent when someone submits an application' },
    { key: 'application_accepted', label: 'Application Accepted', description: 'Sent when an application is approved' },
    { key: 'application_denied', label: 'Application Denied', description: 'Sent when an application is rejected' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateType: string, subject: string, body: string) => {
    setSaving(true);
    try {
      // Use upsert to either update existing or create new template
      const { error } = await supabase
        .from('email_templates')
        .upsert({ 
          template_type: templateType,
          subject, 
          body, 
          is_active: true,
          updated_at: new Date().toISOString() 
        }, {
          onConflict: 'template_type'
        });

      if (error) throw error;

      await fetchTemplates();
      toast({
        title: "Success",
        description: "Email template saved successfully"
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testTemplate = async (templateType: string) => {
    try {
      const { error } = await supabase.functions.invoke('test-email', {
        body: { templateType, testEmail: 'test@example.com' }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "Check the logs to see if the email was sent successfully"
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const getTemplate = (templateType: string) => {
    return templates.find(t => t.template_type === templateType);
  };

  const TemplateForm = ({ templateType, label }: { templateType: string; label: string }) => {
    const template = getTemplate(templateType);
    const [subject, setSubject] = useState(template?.subject || '');
    const [body, setBody] = useState(template?.body || '');

    useEffect(() => {
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    }, [template]);

    const handleSave = () => {
      updateTemplate(templateType, subject, body);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground">
              {templateTypes.find(t => t.key === templateType)?.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testTemplate(templateType)}
              disabled={!template}
            >
              <Eye className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`subject-${templateType}`}>Email Subject</Label>
            <Input
              id={`subject-${templateType}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div>
            <Label htmlFor={`body-${templateType}`}>Email Body</Label>
            <Textarea
              id={`body-${templateType}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">Available Variables</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Badge variant="secondary">{'{{applicant_name}}'}</Badge>
              <Badge variant="secondary">{'{{application_type}}'}</Badge>
              <Badge variant="secondary">{'{{review_notes}}'}</Badge>
              <Badge variant="secondary">{'{{discord_name}}'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              These variables will be replaced with actual values when emails are sent.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Template Manager
        </CardTitle>
        <CardDescription>
          Configure email templates for application responses. These will be sent automatically when applications are processed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="application_submitted" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="application_submitted">Submitted</TabsTrigger>
            <TabsTrigger value="application_accepted">Accepted</TabsTrigger>
            <TabsTrigger value="application_denied">Denied</TabsTrigger>
          </TabsList>

          {templateTypes.map((type) => (
            <TabsContent key={type.key} value={type.key} className="mt-6">
              <TemplateForm templateType={type.key} label={type.label} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};