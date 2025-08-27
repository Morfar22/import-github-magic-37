import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

// Resend client is initialized per request to ensure latest secret is used

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  templateType: 'application_submitted' | 'application_approved' | 'application_denied' | 'application_accepted';
  recipientEmail?: string;
  applicantName: string;
  applicationType: string;
  reviewNotes?: string;
  discordName?: string;
  steamName?: string;
  fivemName?: string;
  // Legacy support
  type?: string;
  userEmail?: string;
  applicationData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody: EmailRequest = await req.json();
    console.log('Email request received:', requestBody);

    // Handle legacy format for backward compatibility
    if (requestBody.type && requestBody.userEmail) {
      return handleLegacyRequest(requestBody);
    }

    const { 
      applicationId, 
      templateType, 
      recipientEmail, 
      applicantName, 
      applicationType, 
      reviewNotes, 
      discordName,
      steamName,
      fivemName
    } = requestBody;

    const effectiveTemplateType = templateType === 'application_accepted' ? 'application_approved' : templateType;
    console.log('Sending email for application:', applicationId, 'type:', effectiveTemplateType);

    // Resolve recipient email (fallback to profile or auth.users if not provided)
    let targetEmail = (recipientEmail || '').trim();

    if (!targetEmail) {
      const { data: appRow, error: appError } = await supabase
        .from('applications')
        .select('user_id')
        .eq('id', applicationId)
        .single();

      if (appError || !appRow) {
        console.error('Application lookup failed:', appError);
        return new Response(
          JSON.stringify({ error: 'Application not found', success: false }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const userId = appRow.user_id;

      // Try profiles.email first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Profile lookup error (non-fatal):', profileError);
      }

      if (profile?.email) {
        targetEmail = profile.email;
      } else {
        // Fallback to auth.users via Admin API
        const { data: userRes, error: adminErr } = await supabase.auth.admin.getUserById(userId);
        if (adminErr) {
          console.warn('Auth admin getUserById error (non-fatal):', adminErr);
        }
        targetEmail = userRes?.user?.email ?? '';
      }
    }

    if (!targetEmail) {
      console.warn('No email found for user; aborting send');
      return new Response(
        JSON.stringify({ error: 'No email found for user', success: false }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch the email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', effectiveTemplateType)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      throw new Error(`Email template '${effectiveTemplateType}' not found or inactive`);
    }

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    const replacements = {
      '{{applicant_name}}': applicantName || 'Applicant',
      '{{application_type}}': applicationType || 'Application',
      '{{review_notes}}': reviewNotes || '',
      '{{discord_name}}': discordName || '',
      '{{steam_name}}': steamName || '',
      '{{fivem_name}}': fivemName || '',
      '{{server_name}}': 'Adventurer RP', // You can make this dynamic later
      '{{today_date}}': new Date().toLocaleDateString()
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value);
      emailBody = emailBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Initialize Resend per request (avoids stale/missing secrets on cold starts)
    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      // Fallback: load from server_settings (service role client)
      try {
        const { data: keyRow } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'resend_api_key')
          .single();
        const val = keyRow?.setting_value;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
      } catch (e) {
        console.warn('Failed to load RESEND key from server_settings:', e);
      }
    }
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY missing');
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const resend = new Resend(RESEND_API_KEY);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [targetEmail],
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'),
      text: emailBody,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log('Email sent successfully:', emailResponse);

    // Log the email send
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'email_sent',
        resource_type: 'application',
        resource_id: applicationId,
        new_values: {
          template_type: templateType,
          recipient_email: targetEmail,
          email_id: emailResponse.data?.id
        }
      });

    if (logError) {
      console.error('Failed to log email send:', logError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

// Legacy handler for backward compatibility
const handleLegacyRequest = async (requestBody: EmailRequest) => {
  try {
    console.log('Processing legacy email request');
    const { type, userEmail, applicationData } = requestBody;
    
    let subject, htmlContent;
    
    if (type === 'approved') {
      subject = "Application Approved - Adventure rp";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #22c55e;">🎉 Application Approved!</h1>
          <p>Congratulations! Your application to Adventure rp has been <strong>approved</strong>.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Notes:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>Welcome to our community! You can now join our FiveM server.</p>
          <p>Best regards,<br>The Adventure rp Team</p>
        </div>
      `;
    } else if (type === 'denied' || type === 'rejected') {
      subject = "Application Update - Adventure rp";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ef4444;">Application Update</h1>
          <p>Thank you for your interest in Adventure rp. Unfortunately, your application has not been approved at this time.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Feedback:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>You're welcome to submit a new application in the future. Please consider the feedback provided.</p>
          <p>Best regards,<br>The Adventure rp Team</p>
        </div>
      `;
    } else {
      subject = "Application Received - Adventure rp";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ff6b6b;">Application Received!</h1>
          <p>Thank you for your application to Adventure rp.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          <p>We'll review your application and get back to you soon.</p>
          <p>Best regards,<br>The Adventure rp Team</p>
        </div>
      `;
    }

    console.log('Sending legacy email to:', userEmail);
    console.log('Email subject:', subject);

    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      try {
        const { data: keyRow } = await createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        ).from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'resend_api_key')
          .single();
        const val = keyRow?.setting_value;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
      } catch {}
    }
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const resend = new Resend(RESEND_API_KEY);

    const emailResponse = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [userEmail!],
      subject: subject,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error('Resend error in legacy handler:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log('Legacy email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Application email sent successfully",
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in legacy email handler:', error);
    throw error; // Re-throw to be caught by main handler
  }
};

serve(handler);