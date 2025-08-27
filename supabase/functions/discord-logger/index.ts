import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

serve(async (req) => {
  console.log("=== DISCORD LOGGER FUNCTION START ===")
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, settings } = await req.json()
    console.log("Discord logger request:", { type, data: !!data, settings: !!settings })
    console.log("FULL DATA RECEIVED:", JSON.stringify(data, null, 2))

    // Get Discord logging settings from database
    let discordSettings: any = {}
    let applicationDiscordSettings: any = {}
    
    try {
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'discord_logging_settings')
        .maybeSingle()

      if (settingsError) {
        console.log('Settings error (using defaults):', settingsError.message)
      } else if (settingsData?.setting_value) {
        discordSettings = settingsData.setting_value
      }
    } catch (error) {
      console.log('Failed to fetch discord settings, using defaults:', error)
    }

    // Also get application-specific Discord settings
    try {
      const { data: appSettingsData, error: appSettingsError } = await supabaseAdmin
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'application_discord_settings')
        .maybeSingle()

      if (appSettingsError) {
        console.log('Application settings error (using defaults):', appSettingsError.message)
      } else if (appSettingsData?.setting_value) {
        applicationDiscordSettings = appSettingsData.setting_value
      }
    } catch (error) {
      console.log('Failed to fetch application discord settings, using defaults:', error)
    }

    // Channel-specific webhook URLs - only use database settings, no fallbacks
    const webhooks = {
      applications: applicationDiscordSettings.public_webhook_url || discordSettings.applications_webhook || '',
      staff: discordSettings.staff_webhook || '', 
      security: discordSettings.security_webhook || '',
      general: discordSettings.general_webhook || '',
      packages: discordSettings.packages_webhook || '',
      errors: discordSettings.errors_webhook || ''
    }

    console.log("Available webhooks:", webhooks)
    console.log("Application Discord Settings:", applicationDiscordSettings)
    console.log("General Discord Settings:", discordSettings)

    let webhookUrl = ''
    let embed: any = {}
    let content = ''

    // Determine webhook and format message based on event type
    switch (type) {
      case 'application_submitted':
        webhookUrl = webhooks.applications
        console.log('Application submitted - webhook URL found:', webhookUrl)
        
        // Get user profile data if user_id or email is available
        let userProfile = null;
        if (data.user_id) {
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('username, email, steam_id')
              .eq('id', data.user_id)
              .single();
            userProfile = profile;
          } catch (error) {
            console.log('Failed to fetch user profile:', error);
          }
        } else if (data.applicantEmail || data.user_email) {
          try {
            const email = data.applicantEmail || data.user_email;
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('username, email, steam_id')
              .eq('email', email)
              .single();
            userProfile = profile;
          } catch (error) {
            console.log('Failed to fetch user profile by email:', error);
          }
        }
        
        // Extract data from form_data if available, fallback to direct fields, then user profile
        const steamName = data.steam_name || data.form_data?.steam_name || userProfile?.username || userProfile?.email || "Not provided";
        const discordTag = data.discord_tag || data.form_data?.discord_tag || "Not provided";
        const fivemName = data.fivem_name || data.form_data?.fivem_name || steamName || "Not provided";
        const age = data.age || data.form_data?.age || "Not provided";
        const applicantEmail = data.applicantEmail || data.user_email || userProfile?.email || "Not provided";
        
        embed = {
          title: "🆕 New Application Submitted",
          color: 0x3498db, // Blue
          fields: [
            { name: "Applicant Email", value: applicantEmail, inline: true },
            { name: "Steam Name", value: steamName, inline: true },
            { name: "Discord Tag", value: discordTag, inline: true },
            { name: "FiveM Name", value: fivemName, inline: true },
            { name: "Age", value: age.toString(), inline: true },
            { name: "Status", value: "Pending Review", inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `📋 **New application received** from **${steamName}** (${applicantEmail})`
        break

      case 'application_approved':
        webhookUrl = applicationDiscordSettings.staff_webhook_url
        const approvedSteamName = data.steam_name || data.form_data?.steam_name || "Not provided";
        const approvedDiscordTag = data.discord_tag || data.form_data?.discord_tag || "Not provided";
        const approvedFivemName = data.fivem_name || data.form_data?.fivem_name || "Not provided";
        
        embed = {
          title: "✅ Application Approved",
          color: 0x27ae60, // Green
          fields: [
            { name: "Steam Name", value: approvedSteamName, inline: true },
            { name: "Discord Tag", value: approvedDiscordTag, inline: true },
            { name: "FiveM Name", value: approvedFivemName, inline: true },
            { name: "Review Notes", value: data.review_notes || "No notes provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `🎉 **Application approved** for **${approvedSteamName}**${data.discord_name ? ` (<@${data.discord_name.replace(/[@<>]/g, '')}>)` : ''}! Welcome to the server!`
        break

      case 'application_denied':
        webhookUrl = applicationDiscordSettings.staff_webhook_url
        const deniedSteamName = data.steam_name || data.form_data?.steam_name || "Not provided";
        const deniedDiscordTag = data.discord_tag || data.form_data?.discord_tag || "Not provided";
        const deniedFivemName = data.fivem_name || data.form_data?.fivem_name || "Not provided";
        
        embed = {
          title: "❌ Application Denied",
          color: 0xe74c3c, // Red
          fields: [
            { name: "Steam Name", value: deniedSteamName, inline: true },
            { name: "Discord Tag", value: deniedDiscordTag, inline: true },
            { name: "FiveM Name", value: deniedFivemName, inline: true },
            { name: "Reason", value: data.review_notes || "No reason provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `🚫 **Application denied** for **${deniedSteamName}**${data.discord_name ? ` (<@${data.discord_name.replace(/[@<>]/g, '')}>)` : ''}`
        break

      case 'staff_action':
        webhookUrl = webhooks.staff
        content = `🛡️ **Staff action performed** by **${data.staff_name || 'Unknown Staff'}**`
        embed = {
          title: '🛡️ Staff Action',
          color: 0xf39c12, // Orange
          fields: [
            { name: 'Action', value: data.action || 'Unknown', inline: true },
            { name: 'Target', value: data.target || 'Unknown', inline: true },
            { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Staff System' }
        }
        break

      case 'user_banned':
        webhookUrl = webhooks.security
        content = `🔨 **User banned** - **${data.username || 'Unknown User'}**`
        embed = {
          title: '🔨 User Banned',
          color: 0x992d22, // Dark Red
          fields: [
            { name: 'Username', value: data.username || 'Unknown', inline: true },
            { name: 'Banned By', value: data.banned_by || 'System', inline: true },
            { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Security System' }
        }
        break

      case 'user_unbanned':
        webhookUrl = webhooks.security
        content = `🔓 **User unbanned** - **${data.username || 'Unknown User'}**`
        embed = {
          title: '🔓 User Unbanned',
          color: 0x27ae60, // Green
          fields: [
            { name: 'Username', value: data.username || 'Unknown', inline: true },
            { name: 'Unbanned By', value: data.unbanned_by || 'System', inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Security System' }
        }
        break

      case 'server_start':
        webhookUrl = webhooks.general
        content = `🟢 **Server started** - ${data.server_name || 'FiveM Server'}`
        embed = {
          title: '🟢 Server Started',
          color: 0x27ae60, // Green
          fields: [
            { name: 'Server', value: data.server_name || 'FiveM Server', inline: true },
            { name: 'Players', value: `0/${data.max_players || 'Unknown'}`, inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Status' }
        }
        break

      case 'server_stop':
        webhookUrl = webhooks.general
        content = `🔴 **Server stopped** - ${data.server_name || 'FiveM Server'}`
        embed = {
          title: '🔴 Server Stopped',
          color: 0xe74c3c, // Red
          fields: [
            { name: 'Server', value: data.server_name || 'FiveM Server', inline: true },
            { name: 'Reason', value: data.reason || 'Unknown', inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Status' }
        }
        break

      case 'error_occurred':
        webhookUrl = webhooks.errors
        content = `🚨 **Error occurred** in ${data.component || 'Unknown Component'}`
        embed = {
          title: '🚨 System Error',
          color: 0xe74c3c, // Red
          fields: [
            { name: 'Component', value: data.component || 'Unknown', inline: true },
            { name: 'Error Type', value: data.error_type || 'Unknown', inline: true },
            { name: 'Message', value: data.message || 'No message provided', inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Error System' }
        }
        break

      case 'rule_updated':
        webhookUrl = webhooks.staff
        content = `📋 **Server rules updated** by **${data.staff_name || 'Unknown Staff'}**`
        embed = {
          title: '📋 Rules Updated',
          color: 0x2ecc71, // Green
          fields: [
            { name: 'Action', value: data.action || 'Updated', inline: true },
            { name: 'Rule Category', value: data.category || 'General', inline: true },
            { name: 'Updated By', value: data.staff_name || 'Unknown', inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Management' }
        }
        break

      case 'staff_promoted':
        webhookUrl = webhooks.staff
        content = `⬆️ **Staff promoted** - **${data.username || 'Unknown User'}**`
        embed = {
          title: '⬆️ Staff Promotion',
          color: 0xf39c12, // Orange
          fields: [
            { name: 'User', value: data.username || 'Unknown', inline: true },
            { name: 'New Role', value: data.new_role || 'Unknown', inline: true },
            { name: 'Promoted By', value: data.promoted_by || 'System', inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Staff System' }
        }
        break

      case 'staff_demoted':
        webhookUrl = webhooks.staff
        content = `⬇️ **Staff demoted** - **${data.username || 'Unknown User'}**`
        embed = {
          title: '⬇️ Staff Demotion',
          color: 0xe67e22, // Orange
          fields: [
            { name: 'User', value: data.username || 'Unknown', inline: true },
            { name: 'Previous Role', value: data.previous_role || 'Unknown', inline: true },
            { name: 'Demoted By', value: data.demoted_by || 'System', inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'FiveM Server Staff System' }
        }
        break

      case 'purchase_completed':
        webhookUrl = webhooks.packages
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: data.currency || 'USD',
        }).format((data.price || 0) / 100);
        
        content = `🎉 **New package purchase** from **${data.username || data.customerName || data.customerEmail}**!`
        embed = {
          title: '💰 New Purchase Completed!',
          color: 0x00ff00, // Green
          fields: [
            { name: 'Customer Email', value: data.customerEmail || 'Not provided', inline: true },
            { name: 'Username', value: data.username || data.customerName || 'Not provided', inline: true },
            { name: 'Package', value: data.packageName || 'Not specified', inline: true },
            { name: 'Amount', value: formattedPrice, inline: true },
            { name: 'Purchase Date', value: new Date().toLocaleString(), inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'Package Purchase System' }
        }
        break

      default:
        console.log('Unknown event type:', type)
        return new Response(
          JSON.stringify({ error: 'Unknown event type' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    if (!webhookUrl) {
      console.log('No webhook URL configured for event type:', type)
      return new Response(
        JSON.stringify({ error: 'No webhook URL configured' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('FULL DATA RECEIVED:', data)
    console.log('Sending to Discord webhook:', webhookUrl)

    const payload = {
      content,
      embeds: [embed]
    }

    console.log('Discord payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log('Discord webhook response status:', response.status)
    console.log('Discord webhook response:', responseText)

    if (!response.ok) {
      console.error('Discord webhook error:', response.status, responseText)
      throw new Error(`Discord webhook failed: ${response.status} - ${responseText}`)
    }

    console.log('Discord message sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhookUrl: webhookUrl.substring(0, 50) + '...', // Partial URL for debugging
        status: response.status,
        type: type
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Discord logger error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send Discord message', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})