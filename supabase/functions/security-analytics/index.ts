import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();

    console.log('Security analytics function called with action:', action);

    switch (action) {
      case 'getSecurityMetrics':
        return await getSecurityMetrics(supabaseClient);
      
      case 'getAuditLogs':
        return await getAuditLogs(supabaseClient, data?.limit || 50);
      
      case 'getFailedLogins':
        return await getFailedLogins(supabaseClient, data?.limit || 50);
      
      case 'blockIP':
        return await blockIP(supabaseClient, data.ip, data.duration || 24);
      
      case 'unblockIP':
        return await unblockIP(supabaseClient, data.ip);
      
      case 'getUserActivity':
        return await getUserActivity(supabaseClient, data.userId);
      
      case 'getSecurityAlerts':
        return await getSecurityAlerts(supabaseClient);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in security analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getSecurityMetrics(supabase: any) {
  try {
    // Get user stats
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, banned, created_at');

    if (profilesError) throw profilesError;

    // Get failed login attempts in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: failedLogins, error: failedLoginError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('last_attempt', yesterday);

    if (failedLoginError) throw failedLoginError;

    // Get audit logs count in last 24 hours
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('id')
      .gte('created_at', yesterday);

    if (auditError) throw auditError;

    // Get blocked IPs
    const now = new Date().toISOString();
    const { data: blockedIPs, error: blockedError } = await supabase
      .from('failed_login_attempts')
      .select('ip_address')
      .not('blocked_until', 'is', null)
      .gt('blocked_until', now);

    if (blockedError) throw blockedError;

    // Get active sessions count
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .gt('expires_at', now);

    if (sessionsError) throw sessionsError;

    const metrics = {
      totalUsers: profiles?.length || 0,
      bannedUsers: profiles?.filter(p => p.banned).length || 0,
      activeUsers: profiles?.filter(p => !p.banned).length || 0,
      failedLoginsToday: failedLogins?.length || 0,
      auditLogsToday: auditLogs?.length || 0,
      blockedIPs: blockedIPs?.length || 0,
      activeSessions: activeSessions?.length || 0,
      securityScore: calculateSecurityScore(profiles, failedLogins, blockedIPs)
    };

    return new Response(
      JSON.stringify({ success: true, data: metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting security metrics:', error);
    throw error;
  }
}

async function getAuditLogs(supabase: any, limit: number) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
}

async function getFailedLogins(supabase: any, limit: number) {
  try {
    const { data, error } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .order('last_attempt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting failed logins:', error);
    throw error;
  }
}

async function blockIP(supabase: any, ip: string, durationHours: number) {
  try {
    const blockUntil = new Date();
    blockUntil.setHours(blockUntil.getHours() + durationHours);

    const { error } = await supabase
      .from('failed_login_attempts')
      .upsert({
        ip_address: ip,
        attempt_count: 999,
        first_attempt: new Date().toISOString(),
        last_attempt: new Date().toISOString(),
        blocked_until: blockUntil.toISOString()
      });

    if (error) throw error;

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        action: 'ip_block',
        resource_type: 'security',
        resource_id: ip,
        ip_address: ip,
        new_values: { blocked_until: blockUntil.toISOString(), duration_hours: durationHours }
      });

    return new Response(
      JSON.stringify({ success: true, message: `IP ${ip} blocked for ${durationHours} hours` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error blocking IP:', error);
    throw error;
  }
}

async function unblockIP(supabase: any, ip: string) {
  try {
    const { error } = await supabase
      .from('failed_login_attempts')
      .update({ blocked_until: null })
      .eq('ip_address', ip);

    if (error) throw error;

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        action: 'ip_unblock',
        resource_type: 'security',
        resource_id: ip,
        ip_address: ip,
        new_values: { blocked_until: null }
      });

    return new Response(
      JSON.stringify({ success: true, message: `IP ${ip} unblocked` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error unblocking IP:', error);
    throw error;
  }
}

async function getUserActivity(supabase: any, userId: string) {
  try {
    // Get user's audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (auditError) throw auditError;

    // Get user's sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) throw sessionsError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          auditLogs: auditLogs || [], 
          sessions: sessions || [] 
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw error;
  }
}

async function getSecurityAlerts(supabase: any) {
  try {
    const alerts = [];
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for high failed login rate
    const { data: failedLogins } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('last_attempt', yesterday.toISOString());

    if (failedLogins && failedLogins.length > 50) {
      alerts.push({
        type: 'warning',
        title: 'High Failed Login Rate',
        message: `${failedLogins.length} failed login attempts in the last 24 hours`,
        severity: 'high'
      });
    }

    // Check for banned users activity
    const { data: bannedUsers } = await supabase
      .from('profiles')
      .select('id, banned_at')
      .eq('banned', true)
      .gte('banned_at', yesterday.toISOString());

    if (bannedUsers && bannedUsers.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Recent User Bans',
        message: `${bannedUsers.length} users banned in the last 24 hours`,
        severity: 'medium'
      });
    }

    // Check for multiple login attempts from same IP
    const ipCounts: { [key: string]: number } = {};
    failedLogins?.forEach(login => {
      const ip = login.ip_address;
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    const suspiciousIPs = Object.entries(ipCounts).filter(([ip, count]) => count > 10);
    if (suspiciousIPs.length > 0) {
      alerts.push({
        type: 'danger',
        title: 'Suspicious IP Activity',
        message: `${suspiciousIPs.length} IPs with excessive failed login attempts`,
        severity: 'high'
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: alerts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting security alerts:', error);
    throw error;
  }
}

function calculateSecurityScore(profiles: any[], failedLogins: any[], blockedIPs: any[]): number {
  let score = 100;

  // Deduct points for banned users
  const bannedPercentage = profiles ? (profiles.filter(p => p.banned).length / profiles.length) * 100 : 0;
  score -= Math.min(bannedPercentage * 2, 30);

  // Deduct points for failed logins
  if (failedLogins && failedLogins.length > 20) {
    score -= Math.min((failedLogins.length - 20) * 0.5, 20);
  }

  // Add points for having blocked IPs (shows active security)
  if (blockedIPs && blockedIPs.length > 0) {
    score += Math.min(blockedIPs.length * 2, 10);
  }

  return Math.max(Math.round(score), 0);
}