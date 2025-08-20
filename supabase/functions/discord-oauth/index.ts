import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discordClientId = Deno.env.get('DISCORD_CLIENT_ID');
const discordClientSecret = Deno.env.get('DISCORD_CLIENT_SECRET');

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== DISCORD OAUTH FUNCTION START ===');

  try {
    const { action, data } = await req.json();
    console.log('Discord OAuth action:', action);

    let result;
    switch (action) {
      case 'get_auth_url':
        result = await getDiscordAuthUrl(data.redirectUri);
        break;
      case 'exchange_code':
        result = await exchangeCodeForTokens(data.code, data.redirectUri);
        break;
      case 'refresh_token':
        result = await refreshDiscordToken(data.refreshToken);
        break;
      case 'disconnect':
        result = await disconnectDiscord(data.userId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Discord OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getDiscordAuthUrl(redirectUri: string) {
  if (!discordClientId) {
    throw new Error('Discord client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: discordClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state: crypto.randomUUID(),
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  
  return { authUrl };
}

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  if (!discordClientId || !discordClientSecret) {
    throw new Error('Discord OAuth credentials not configured');
  }

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Failed to exchange code: ${errorData}`);
  }

  const tokens = await tokenResponse.json();

  // Get user info from Discord
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to get Discord user info');
  }

  const discordUser = await userResponse.json();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    user: {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
    },
  };
}

async function refreshDiscordToken(refreshToken: string) {
  if (!discordClientId || !discordClientSecret) {
    throw new Error('Discord OAuth credentials not configured');
  }

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh token: ${errorData}`);
  }

  const tokens = await response.json();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };
}

async function disconnectDiscord(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      discord_id: null,
      discord_username: null,
      discord_discriminator: null,
      discord_access_token: null,
      discord_refresh_token: null,
      discord_connected_at: null,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to disconnect Discord: ${error.message}`);
  }

  return { disconnected: true };
}