-- Update email templates to include more detailed information and remove hardcoded server names
UPDATE public.email_templates 
SET body = 'Dear {{applicant_name}},

Thank you for your interest in {{server_name}}.

After careful review, we regret to inform you that your application has not been approved at this time.

Application Details:
- Applicant: {{applicant_name}}
- Discord: {{discord_name}}
- Steam: {{steam_name}}
- FiveM: {{fivem_name}}
- Application Type: {{application_type}}
- Status: Not Approved
- Review Date: {{today_date}}

Staff Feedback: {{review_notes}}

Please don''t be discouraged! You''re welcome to submit a new application in the future. We encourage you to:
- Review our server rules and guidelines
- Consider the feedback provided above
- Take some time to develop your character concept further

If you have any questions about this decision, feel free to reach out to our staff team.

Best regards,
The {{server_name}} Staff Team'
WHERE template_type = 'application_denied';

UPDATE public.email_templates 
SET 
  subject = '🎉 Application Approved - Welcome to {{server_name}}!',
  body = 'Congratulations {{applicant_name}}!

Your application to {{server_name}} has been APPROVED! Welcome to our community!

Application Details:
- Applicant: {{applicant_name}}
- Discord: {{discord_name}}
- Steam: {{steam_name}}
- FiveM: {{fivem_name}}
- Application Type: {{application_type}}
- Status: APPROVED ✅
- Approval Date: {{today_date}}

Staff Notes: {{review_notes}}

Next Steps:
1. Join our Discord server if you haven''t already
2. Read our server rules carefully
3. Create your character and start your RP journey!

We''re excited to have you as part of our community. See you in the city!

Best regards,
The {{server_name}} Staff Team'
WHERE template_type = 'application_approved';

UPDATE public.email_templates 
SET body = 'Dear {{applicant_name}},

Thank you for submitting your application to {{server_name}}!

We have received your {{application_type}} application and it is now under review by our staff team.

Application Details:
- Applicant: {{applicant_name}}
- Discord: {{discord_name}}
- Steam: {{steam_name}}
- FiveM: {{fivem_name}}
- Application Type: {{application_type}}
- Submitted: {{today_date}}

Our team will review your application carefully and get back to you soon. Please be patient as we process all applications thoroughly.

If you have any questions, feel free to reach out to us on Discord.

Best regards,
The {{server_name}} Staff Team'
WHERE template_type = 'application_submitted';