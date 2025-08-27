import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// Resend client will be initialized per-request to avoid stale/missing secrets

// CORS headers for browser compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main edge function handler
const handler = async (req: Request): Promise<Response> => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Password reset function called");

    // Parse payload and resolve email if missing
    let body: { userEmail?: string; userId?: string };
    try {
      body = await req.json();
      console.log("Incoming request body:", body);
    } catch {
      console.log("Failed to parse request body");
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Determine redirect domain early
    const originHeader = req.headers.get('origin') || req.headers.get('referer');
    const redirectDomain = originHeader || 'adventurerp.dk';
    console.log("Using redirect domain:", redirectDomain);

    let targetEmail = (body.userEmail || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      if (body.userId) {
        try {
          const { data: userRes, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(body.userId);
          if (adminErr) console.warn('admin.getUserById error:', adminErr);
          targetEmail = userRes?.user?.email || '';
        } catch (e) {
          console.warn('Lookup by userId failed:', e);
        }
      }
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate password reset link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
      options: {
        redirectTo: `${redirectDomain}/auth`
      }
    });

    if (error) {
      console.log("Supabase error:", error);
      throw error;
    }
    console.log("Password reset link generated for:", targetEmail);

    // Initialize Resend per-request and support DB fallback for key
    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      try {
        const { data: keyRow } = await supabaseAdmin
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'resend_api_key')
          .maybeSingle();
        const val: any = keyRow?.setting_value;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
      } catch (e) {
        console.warn('Failed to load RESEND key from server_settings:', e);
      }
    }
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const resend = new Resend(RESEND_API_KEY);

    // Email user the password reset link via Resend
    const emailResponse = await resend.emails.send({
      from: "Gaming Community <noreply@adventurerp.dk>",
      to: [targetEmail],
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b6b; text-align: center;">Password Reset Request</h1>
          <p>You have requested to reset your password for your Gaming Community account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.properties.action_link}" 
               style="background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
            ${data.properties.action_link}
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, you can safely ignore this email.
            This link will expire in 24 hours.
          </p>
        </div>
      `
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset email sent successfully',
        emailResponse
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        }
      }
    );
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

serve(handler);
