import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

// Check if RESEND_API_KEY is available
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
console.log('RESEND_API_KEY available:', !!RESEND_API_KEY);
if (!RESEND_API_KEY) {
  console.error('CRITICAL: RESEND_API_KEY environment variable not found!');
}

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  templateType: 'application_submitted' | 'application_accepted' | 'application_denied';
  recipientEmail: string;
  applicantName: string;
  applicationType: string;
  reviewNotes?: string;
  discordName?: string;
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
      discordName 
    } = requestBody;

    console.log('Sending email for application:', applicationId, 'type:', templateType);

    // Fetch the email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      throw new Error(`Email template '${templateType}' not found or inactive`);
    }

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    const replacements = {
      '{{applicant_name}}': applicantName || 'Applicant',
      '{{application_type}}': applicationType || 'Application',
      '{{review_notes}}': reviewNotes || '',
      '{{discord_name}}': discordName || ''
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value);
      emailBody = emailBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "DreamLight RP <noreply@dreamlightrp.co>",
      to: [recipientEmail],
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
          recipient_email: recipientEmail,
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
      subject = "Application Approved - DreamLight RP";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #22c55e;">🎉 Application Approved!</h1>
          <p>Congratulations! Your application to DreamLight RP has been <strong>approved</strong>.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Notes:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>Welcome to our community! You can now join our FiveM server.</p>
          <p>Best regards,<br>The DreamLight RP Team</p>
        </div>
      `;
    } else if (type === 'denied' || type === 'rejected') {
      subject = "Application Update - DreamLight RP";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ef4444;">Application Update</h1>
          <p>Thank you for your interest in DreamLight RP. Unfortunately, your application has not been approved at this time.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Feedback:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>You're welcome to submit a new application in the future. Please consider the feedback provided.</p>
          <p>Best regards,<br>The DreamLight RP Team</p>
        </div>
      `;
    } else {
      subject = "Application Received - DreamLight RP";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ff6b6b;">Application Received!</h1>
          <p>Thank you for your application to DreamLight RP.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          <p>We'll review your application and get back to you soon.</p>
          <p>Best regards,<br>The DreamLight RP Team</p>
        </div>
      `;
    }

    console.log('Sending legacy email to:', userEmail);
    console.log('Email subject:', subject);

    const emailResponse = await resend.emails.send({
      from: "DreamLight RP <noreply@dreamlightrp.co>",
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