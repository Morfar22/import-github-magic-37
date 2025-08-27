import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, packageName, price, currency } = await req.json();

    // Create Supabase client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { persistSession: false }
      }
    );

    // Get user profile for more info
    let userProfile = null;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username, email")
      .eq("email", customerEmail)
      .single();
    
    userProfile = profile;

    // Send purchase notification to Discord via discord-logger function
    try {
      const { data: discordResult, error: discordError } = await supabaseAdmin.functions.invoke('discord-logger', {
        body: {
          type: 'purchase_completed',
          data: {
            customerEmail,
            customerName,
            username: userProfile?.username,
            packageName,
            price,
            currency
          }
        }
      });

      if (discordError) {
        console.error('Failed to send Discord notification:', discordError);
      } else {
        console.log('Discord notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending Discord notification:', error);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Purchase webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});