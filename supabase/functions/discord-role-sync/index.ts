import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== DISCORD ROLE SYNC FUNCTION START ===');

  try {
    const { userId, action } = await req.json();
    console.log('Discord role sync request:', { userId, action });

    // Get user's current roles from both legacy and new system
    const userRoles = await getUserRoles(userId);
    
    // Get Discord settings
    const { data: settingsData } = await supabase
      .from('server_settings')
      .select('setting_value')
      .eq('setting_key', 'discord_settings')
      .single();

    const discordSettings = settingsData?.setting_value || {};
    
    if (!discordSettings.server_id || !discordSettings.auto_roles) {
      return new Response(
        JSON.stringify({ success: false, error: 'Discord auto-roles not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get user's Discord ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('discord_id')
      .eq('id', userId)
      .single();

    if (!profile?.discord_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User has not connected Discord' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sync roles with Discord bot
    const syncResult = await supabase.functions.invoke('discord-bot', {
      body: {
        action: 'sync_user_roles',
        data: {
          userId: profile.discord_id,
          guildId: discordSettings.server_id,
          internalRoles: userRoles
        }
      }
    });

    if (syncResult.error) throw syncResult.error;

    return new Response(
      JSON.stringify({ success: true, result: syncResult.data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Discord role sync error:', error);
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

async function getUserRoles(userId: string): Promise<string[]> {
  const roles: string[] = [];

  // Check legacy user_roles table
  const { data: legacyRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (legacyRoles) {
    roles.push(...legacyRoles.map(r => r.role));
  }

  // Check new user_role_assignments table
  const { data: newRoles } = await supabase
    .from('user_role_assignments')
    .select(`
      staff_roles!inner (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (newRoles) {
    roles.push(...newRoles.map((r: any) => r.staff_roles.name));
  }

  return roles;
}