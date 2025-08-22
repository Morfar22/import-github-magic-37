import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatLogRequest {
  type: 'chat_started' | 'chat_ended' | 'user_banned' | 'chat_assigned';
  sessionId: string;
  visitorName: string;
  visitorEmail?: string;
  staffName?: string;
  banReason?: string;
  ipAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Discord webhook URL from settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('server_settings')
      .select('setting_value')
      .eq('setting_key', 'chat_settings')
      .single();

    if (settingsError) {
      console.error('Error fetching chat settings:', settingsError);
      throw new Error('Failed to fetch chat settings');
    }

    const webhookUrl = settingsData?.setting_value?.discord_webhook_url;
    if (!webhookUrl) {
      console.log('Discord webhook URL not configured in chat settings');
      return new Response(JSON.stringify({ success: false, message: 'Discord webhook not configured' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { type, sessionId, visitorName, visitorEmail, staffName, banReason, ipAddress }: ChatLogRequest = await req.json();

    let embed;
    let color;

    switch (type) {
      case 'chat_started':
        color = 0x00ff00; // Green
        embed = {
          title: "🟢 Live Chat Started",
          fields: [
            { name: "Visitor", value: visitorName, inline: true },
            { name: "Email", value: visitorEmail || "Not provided", inline: true },
            { name: "Session ID", value: sessionId.substring(0, 8) + "...", inline: true }
          ],
          timestamp: new Date().toISOString(),
          color: color
        };
        break;

      case 'chat_assigned':
        color = 0x0099ff; // Blue
        embed = {
          title: "👤 Chat Assigned to Staff",
          fields: [
            { name: "Visitor", value: visitorName, inline: true },
            { name: "Staff Member", value: staffName || "Unknown", inline: true },
            { name: "Session ID", value: sessionId.substring(0, 8) + "...", inline: true }
          ],
          timestamp: new Date().toISOString(),
          color: color
        };
        break;

      case 'user_banned':
        color = 0xff0000; // Red
        embed = {
          title: "🔨 User Banned from Live Chat",
          fields: [
            { name: "Visitor", value: visitorName, inline: true },
            { name: "Email", value: visitorEmail || "Not provided", inline: true },
            { name: "IP Address", value: ipAddress || "Not captured", inline: true },
            { name: "Banned By", value: staffName || "Unknown", inline: true },
            { name: "Reason", value: banReason || "No reason provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          color: color
        };
        break;

      case 'chat_ended':
        color = 0x808080; // Gray
        embed = {
          title: "⏹️ Live Chat Ended",
          fields: [
            { name: "Visitor", value: visitorName, inline: true },
            { name: "Session ID", value: sessionId.substring(0, 8) + "...", inline: true }
          ],
          timestamp: new Date().toISOString(),
          color: color
        };
        break;

      default:
        throw new Error(`Unknown log type: ${type}`);
    }

    const discordPayload = {
      embeds: [embed]
    };

    console.log('Sending Discord webhook:', discordPayload);

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      throw new Error(`Discord webhook failed: ${discordResponse.status} - ${errorText}`);
    }

    console.log('Discord webhook sent successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in discord-chat-logger function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);