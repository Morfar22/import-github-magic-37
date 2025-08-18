import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Processing request...");
    const requestBody = await req.json();
    console.log("Full request body:", requestBody);
    
    const { type, userEmail, applicationData } = requestBody;
    console.log("Extracted data:", { type, userEmail, applicationData });

    // Send email using Resend
    let subject, htmlContent;
    
    if (type === 'approved') {
      subject = "Application Approved - Nexus RP Portal";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #22c55e;">🎉 Application Approved!</h1>
          <p>Congratulations! Your application to Nexus RP has been <strong>approved</strong>.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Notes:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>Welcome to our community! You can now join our FiveM server.</p>
          <p>Best regards,<br>The Nexus RP Team</p>
        </div>
      `;
    } else if (type === 'denied' || type === 'rejected') {
      subject = "Application Update - Nexus RP Portal";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ef4444;">Application Update</h1>
          <p>Thank you for your interest in Nexus RP. Unfortunately, your application has not been approved at this time.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Feedback:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>You're welcome to submit a new application in the future. Please consider the feedback provided.</p>
          <p>Best regards,<br>The Nexus RP Team</p>
        </div>
      `;
    } else {
      // Default confirmation email for new applications
      subject = "Application Received - Nexus RP Portal";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ff6b6b;">Application Received!</h1>
          <p>Thank you for your application to Nexus RP.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          <p>We'll review your application and get back to you soon.</p>
          <p>Best regards,<br>The Nexus RP Team</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Nexus RP Portal <noreply@mmorfar.dk>",
      to: [userEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);
    
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
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  }
});