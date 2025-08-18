import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');

const supabase = createClient(supabaseUrl, supabaseKey);

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
}

interface DiscordGuildMember {
  user: DiscordUser;
  roles: string[];
  joined_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== DISCORD BOT FUNCTION START ===');

  try {
    if (!discordBotToken) {
      throw new Error('Discord bot token not configured');
    }

    const { action, data } = await req.json();
    console.log('Discord bot action:', action, 'data:', data);

    let result;
    switch (action) {
      case 'assign_role':
        result = await assignDiscordRole(data.userId, data.guildId, data.roleId);
        break;
      case 'remove_role':
        result = await removeDiscordRole(data.userId, data.guildId, data.roleId);
        break;
      case 'sync_user_roles':
        result = await syncUserRoles(data.userId, data.guildId, data.internalRoles);
        break;
      case 'get_guild_member':
        result = await getGuildMember(data.guildId, data.userId);
        break;
      case 'verify_bot_permissions':
        result = await verifyBotPermissions(data.guildId);
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
    console.error('Discord bot error:', error);
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

async function makeDiscordRequest(endpoint: string, options: RequestInit = {}) {
  const url = `https://discord.com/api/v10${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bot ${discordBotToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Discord API error (${response.status}):`, errorData);
    throw new Error(`Discord API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}

async function assignDiscordRole(userId: string, guildId: string, roleId: string) {
  console.log(`Assigning role ${roleId} to user ${userId} in guild ${guildId}`);
  
  const result = await makeDiscordRequest(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Automatic role assignment from FiveM panel' })
    }
  );

  console.log('Role assigned successfully');
  return result;
}

async function removeDiscordRole(userId: string, guildId: string, roleId: string) {
  console.log(`Removing role ${roleId} from user ${userId} in guild ${guildId}`);
  
  const result = await makeDiscordRequest(
    `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: 'DELETE',
    }
  );

  console.log('Role removed successfully');
  return result;
}

async function syncUserRoles(userId: string, guildId: string, internalRoles: string[]) {
  console.log(`Syncing roles for user ${userId}:`, internalRoles);

  // Get Discord settings to map internal roles to Discord roles
  const { data: settings } = await supabase
    .from('server_settings')
    .select('setting_value')
    .eq('setting_key', 'discord_settings')
    .single();

  if (!settings?.setting_value?.role_mappings) {
    throw new Error('Discord role mappings not configured');
  }

  const roleMappings = settings.setting_value.role_mappings;
  
  // Get current Discord member info
  const member = await getGuildMember(guildId, userId);
  
  // Determine which Discord roles should be assigned/removed
  const targetDiscordRoles = internalRoles
    .filter(role => roleMappings[role])
    .map(role => roleMappings[role]);

  const currentManagedRoles = member.roles.filter(roleId => 
    Object.values(roleMappings).includes(roleId)
  );

  // Add missing roles
  for (const roleId of targetDiscordRoles) {
    if (!member.roles.includes(roleId)) {
      await assignDiscordRole(userId, guildId, roleId);
    }
  }

  // Remove roles that shouldn't be there
  for (const roleId of currentManagedRoles) {
    if (!targetDiscordRoles.includes(roleId)) {
      await removeDiscordRole(userId, guildId, roleId);
    }
  }

  console.log('Role sync completed');
  return { 
    assigned: targetDiscordRoles,
    removed: currentManagedRoles.filter(role => !targetDiscordRoles.includes(role))
  };
}

async function getGuildMember(guildId: string, userId: string): Promise<DiscordGuildMember> {
  console.log(`Getting guild member ${userId} from ${guildId}`);
  
  const member = await makeDiscordRequest(`/guilds/${guildId}/members/${userId}`);
  console.log('Retrieved guild member:', member.user.username);
  
  return member;
}

async function verifyBotPermissions(guildId: string) {
  console.log(`Verifying bot permissions in guild ${guildId}`);
  
  // Get bot's member info in the guild
  const botUser = await makeDiscordRequest('/users/@me');
  const botMember = await getGuildMember(guildId, botUser.id);
  
  // Get guild roles to check permissions
  const guildRoles = await makeDiscordRequest(`/guilds/${guildId}/roles`);
  
  const botRoles = guildRoles.filter((role: any) => 
    botMember.roles.includes(role.id)
  );

  // Check if bot has manage roles permission or administrator permission
  const hasManageRoles = botRoles.some((role: any) => {
    const permissions = BigInt(role.permissions);
    const MANAGE_ROLES = 0x10000000n; // 268435456
    const ADMINISTRATOR = 0x8n; // 8
    
    return (permissions & MANAGE_ROLES) === MANAGE_ROLES || 
           (permissions & ADMINISTRATOR) === ADMINISTRATOR;
  });

  console.log('Bot permissions verified:', { hasManageRoles });
  
  return {
    botId: botUser.id,
    hasManageRoles,
    botRoles: botRoles.map((role: any) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions
    }))
  };
}