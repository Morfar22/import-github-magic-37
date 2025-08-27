-- Insert sample email templates for the application system
INSERT INTO public.email_templates (template_type, subject, body, is_active) VALUES
(
  'application_submitted',
  'Application Received - {{application_type}}',
  'Dear {{applicant_name}},

Thank you for submitting your application to Adventure rp!

We have received your {{application_type}} application and it is now under review by our staff team.

Application Details:
- Applicant: {{applicant_name}}
- Discord: {{discord_name}}
- Submitted: Now

Our team will review your application carefully and get back to you soon. Please be patient as we process all applications thoroughly.

If you have any questions, feel free to reach out to us on Discord.

Best regards,
The Adventure rp Staff Team'
  , true
),
(
  'application_approved',
  '🎉 Application Approved - Welcome to Adventure rp!',
  'Congratulations {{applicant_name}}!

Your application to Adventure rp has been APPROVED! Welcome to our community!

Application Details:
- Applicant: {{applicant_name}}
- Discord: {{discord_name}}
- Status: APPROVED ✅

{{#if review_notes}}
Staff Notes: {{review_notes}}
{{/if}}

Next Steps:
1. Join our Discord server if you haven''t already
2. Read our server rules carefully
3. Create your character and start your RP journey!

We''re excited to have you as part of our community. See you in the city!

Best regards,
The Adventure rp Staff Team'
  , true
),
(
  'application_denied',
  'Application Update - Adventure rp',
  'Dear {{applicant_name}},

Thank you for your interest in Adventure rp.

After careful review, we regret to inform you that your application has not been approved at this time.

Application Details:
- Applicant: {{applicant_name}}
- Discord: {{discord_name}}
- Status: Not Approved

{{#if review_notes}}
Staff Feedback: {{review_notes}}
{{/if}}

Please don''t be discouraged! You''re welcome to submit a new application in the future. We encourage you to:
- Review our server rules and guidelines
- Consider the feedback provided above
- Take some time to develop your character concept further

If you have any questions about this decision, feel free to reach out to our staff team.

Best regards,
The Adventure rp Staff Team'
  , true
)
ON CONFLICT (template_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  is_active = EXCLUDED.is_active,
  updated_at = now();