-- Create email templates table for managing application email responses
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('application_submitted', 'application_accepted', 'application_denied')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_type, subject, body) VALUES 
('application_submitted', 'Application Received - Adventure rp', 
'Hi {{applicant_name}},

Thank you for submitting your application to Adventure rp! 

We have received your {{application_type}} application and our staff team will review it within the next 24-48 hours.

You will receive another email once your application has been reviewed.

Best regards,
The Adventure rp Team'),

('application_accepted', 'Application Accepted - Welcome to Adventure rp!', 
'Hi {{applicant_name}},

Congratulations! Your {{application_type}} application has been ACCEPTED!

{{review_notes}}

Welcome to the Adventure rp community! You can now join our Discord server and start your roleplay journey.

Best regards,
The Adventure rp Team'),

('application_denied', 'Application Update - Adventure rp', 
'Hi {{applicant_name}},

Thank you for your interest in Adventure rp. Unfortunately, your {{application_type}} application has not been approved at this time.

{{review_notes}}

You are welcome to reapply in the future. Please take the feedback into consideration for your next application.

Best regards,
The Adventure rp Team');