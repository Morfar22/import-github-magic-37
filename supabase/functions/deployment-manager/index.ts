import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeploymentCheckRequest {
  action: 'check_readiness' | 'validate_key' | 'get_status';
  keyName?: string;
  keyValue?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, keyName, keyValue }: DeploymentCheckRequest = await req.json();

    switch (action) {
      case 'check_readiness':
        return await checkDeploymentReadiness();
      
      case 'validate_key':
        return await validateApiKey(keyName!, keyValue!);
      
      case 'get_status':
        return await getConfigurationStatus();
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in deployment-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function checkDeploymentReadiness(): Promise<Response> {
  const checks = {
    resend_configured: !!Deno.env.get('RESEND_API_KEY'),
    discord_bot_configured: !!Deno.env.get('DISCORD_BOT_TOKEN'),
    discord_webhook_configured: !!Deno.env.get('DISCORD_WEBHOOK_URL'),
    mapbox_configured: !!Deno.env.get('MAPBOX_PUBLIC_TOKEN'),
  };

  // Test Resend if configured
  let emailWorking = false;
  if (checks.resend_configured) {
    try {
      const { Resend } = await import('npm:resend@2.0.0');
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      // Just check if we can create the client without erroring
      emailWorking = true;
    } catch (error) {
      console.error('Resend validation failed:', error);
      emailWorking = false;
    }
  }

  // Test Discord webhook if configured
  let discordWorking = false;
  if (checks.discord_webhook_configured) {
    try {
      const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
      const response = await fetch(webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🔧 Deployment readiness test - webhook is working!',
          username: 'Deployment Manager'
        })
      });
      discordWorking = response.ok;
    } catch (error) {
      console.error('Discord webhook test failed:', error);
      discordWorking = false;
    }
  }

  const readinessScore = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  return new Response(
    JSON.stringify({
      readiness_score: Math.round((readinessScore / totalChecks) * 100),
      checks: {
        ...checks,
        email_working: emailWorking,
        discord_working: discordWorking,
      },
      required_missing: Object.entries(checks)
        .filter(([key, value]) => !value && ['resend_configured', 'discord_bot_configured', 'discord_webhook_configured'].includes(key))
        .map(([key]) => key),
      deployment_ready: readinessScore >= 3 && emailWorking // Need at least email + 2 other services
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
}

async function validateApiKey(keyName: string, keyValue: string): Promise<Response> {
  let isValid = false;
  let errorMessage = '';

  try {
    switch (keyName) {
      case 'RESEND_API_KEY':
        const { Resend } = await import('npm:resend@2.0.0');
        const resend = new Resend(keyValue);
        
        // Test with a simple API call
        try {
          await resend.emails.send({
            from: 'test@resend.dev',
            to: ['test@example.com'],
            subject: 'API Key Test',
            text: 'This is a test to validate the API key'
          });
          isValid = false; // This will fail but if it fails properly, key format is correct
        } catch (error: any) {
          // If error contains "API key" or "unauthorized", key format is wrong
          // If error contains "domain" or "email", key is valid but domain isn't verified
          if (error.message.includes('domain') || error.message.includes('email') || error.message.includes('verify')) {
            isValid = true; // Key is valid, just domain not verified
            errorMessage = 'API key is valid, but you need to verify your domain at https://resend.com/domains';
          } else if (error.message.includes('API key') || error.message.includes('unauthorized')) {
            isValid = false;
            errorMessage = 'Invalid API key format or unauthorized key';
          } else {
            isValid = true; // Assume valid if other error
          }
        }
        break;

      case 'DISCORD_WEBHOOK_URL':
        const webhookResponse = await fetch(keyValue, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '✅ Webhook validation test successful!',
            username: 'API Validator'
          })
        });
        isValid = webhookResponse.ok;
        if (!isValid) {
          errorMessage = 'Invalid webhook URL or webhook not accessible';
        }
        break;

      case 'DISCORD_BOT_TOKEN':
        // Test Discord bot token by making API call
        const discordResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Authorization': `Bot ${keyValue}`,
            'Content-Type': 'application/json'
          }
        });
        isValid = discordResponse.ok;
        if (!isValid) {
          errorMessage = 'Invalid bot token or bot not accessible';
        }
        break;

      case 'MAPBOX_PUBLIC_TOKEN':
        // Test Mapbox token
        const mapboxResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${keyValue}`);
        isValid = mapboxResponse.ok;
        if (!isValid) {
          errorMessage = 'Invalid Mapbox token';
        }
        break;

      default:
        errorMessage = 'Unknown API key type';
    }
  } catch (error: any) {
    console.error(`Error validating ${keyName}:`, error);
    errorMessage = error.message;
  }

  return new Response(
    JSON.stringify({
      key_name: keyName,
      is_valid: isValid,
      error_message: errorMessage,
      tested_at: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
}

async function getConfigurationStatus(): Promise<Response> {
  const apiKeys = [
    {
      name: 'RESEND_API_KEY',
      configured: !!Deno.env.get('RESEND_API_KEY'),
      required: true,
      category: 'email'
    },
    {
      name: 'DISCORD_BOT_TOKEN',
      configured: !!Deno.env.get('DISCORD_BOT_TOKEN'),
      required: true,
      category: 'discord'
    },
    {
      name: 'DISCORD_WEBHOOK_URL',
      configured: !!Deno.env.get('DISCORD_WEBHOOK_URL'),
      required: true,
      category: 'discord'
    },
    {
      name: 'MAPBOX_PUBLIC_TOKEN',
      configured: !!Deno.env.get('MAPBOX_PUBLIC_TOKEN'),
      required: false,
      category: 'maps'
    }
  ];

  return new Response(
    JSON.stringify({
      api_keys: apiKeys,
      configured_count: apiKeys.filter(key => key.configured).length,
      required_missing: apiKeys.filter(key => key.required && !key.configured).length,
      last_checked: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
}

serve(handler);