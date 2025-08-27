import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
  siteUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    let SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Fallback: if RESEND_API_KEY missing, try server_settings
    if (!RESEND_API_KEY) {
      try {
        const tmpClient = createClient(SUPABASE_URL, SERVICE_ROLE);
        const { data: keyRow } = await tmpClient
          .from("server_settings")
          .select("setting_value")
          .eq("setting_key", "resend_api_key")
          .single();
        const val = keyRow?.setting_value as any;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
      } catch (e) {
        console.log("RESEND key fallback read failed:", e);
      }
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const resend = new Resend(RESEND_API_KEY);

    const body = (await req.json()) as WelcomeEmailRequest;
    const { email, username, siteUrl } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("send-welcome-email request", { email, username, siteUrl });

    // Try to load a template from DB first
    let subject = "Welcome to Adventure rp!";
    let content = `Welcome ${username ?? "there"}!\n\nYour account has been created.\n\nNext steps:\n- Join our Discord\n- Read the rules\n- Start your RP journey!\n\nSee you in the city!`;

    try {
      const { data: template, error: tplErr } = await supabase
        .from("email_templates")
        .select("subject, body")
        .eq("template_type", "welcome")
        .eq("is_active", true)
        .single();

      if (!tplErr && template) {
        subject = template.subject;
        content = template.body
          .replace(/\{\{username\}\}/g, username ?? "Player")
          .replace(/\{\{email\}\}/g, email)
          .replace(/\{\{registration_date\}\}/g, new Date().toLocaleDateString());
      } else if (tplErr) {
        console.log("No welcome template found, using fallback");
      }
    } catch (e) {
      console.log("Template fetch error (fallback used):", e);
    }

    const html = content.replace(/\n/g, "<br>");

    const emailResponse = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [email],
      subject,
      html,
      text: content,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(emailResponse.error.message);
    }

    // Best-effort audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "email_sent",
        resource_type: "auth",
        resource_id: email,
        new_values: { template_type: "welcome", email_id: emailResponse.data?.id },
      });
    } catch (e) {
      console.log("audit log failed:", e);
    }

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-welcome-email error:", error);
    return new Response(JSON.stringify({ success: false, error: error?.message ?? String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
