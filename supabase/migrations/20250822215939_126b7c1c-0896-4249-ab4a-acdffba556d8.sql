-- Add welcome email template
INSERT INTO public.email_templates (template_type, subject, body, is_active) VALUES
(
  'welcome',
  'Welcome to Adventure rp! 🎮',
  'Welcome {{username}}!

Thank you for joining Adventure rp! We''re excited to have you as part of our community.

Your account has been successfully created with the following details:
- Username: {{username}}
- Email: {{email}}
- Registration Date: {{registration_date}}

What''s Next?
1. 🎯 Explore our server rules and guidelines
2. 🎮 Join our Discord community 
3. 📝 Submit your character application
4. 🚗 Start your roleplay adventure in Los Santos!

Need help getting started? Check out our guides or reach out to our friendly staff team on Discord.

Welcome to the family!

Best regards,
The Adventure rp Team',
  true
)
ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- First update the constraint to include welcome emails
ALTER TABLE public.email_templates 
DROP CONSTRAINT IF EXISTS email_templates_template_type_check;

ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_template_type_check 
CHECK (template_type IN (
  'application_submitted', 
  'application_approved', 
  'application_denied',
  'application_accepted',
  'application_rejected',
  'welcome'
));