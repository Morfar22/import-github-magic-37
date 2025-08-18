import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== SECURITY MANAGER FUNCTION START ===');

  try {
    const { action, data } = await req.json();
    console.log('Security action:', action, 'data:', data);

    let result;
    switch (action) {
      case 'log_audit_event':
        result = await logAuditEvent(data);
        break;
      case 'get_audit_logs':
        result = await getAuditLogs(data.limit || 50);
        break;
      case 'track_failed_login':
        result = await trackFailedLogin(data);
        break;
      case 'check_rate_limit':
        result = await checkRateLimit(data);
        break;
      case 'cleanup_expired_sessions':
        result = await cleanupExpiredSessions();
        break;
      case 'get_security_stats':
        result = await getSecurityStats();
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
    console.error('Security manager error:', error);
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

async function logAuditEvent(eventData: {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  console.log('Logging audit event:', eventData);

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: eventData.userId || null,
      action: eventData.action,
      resource_type: eventData.resourceType || null,
      resource_id: eventData.resourceId || null,
      old_values: eventData.oldValues || null,
      new_values: eventData.newValues || null,
      ip_address: eventData.ipAddress || null,
      user_agent: eventData.userAgent || null
    });

  if (error) {
    console.error('Error logging audit event:', error);
    throw error;
  }

  console.log('Audit event logged successfully');
  return { logged: true };
}

async function getAuditLogs(limit: number = 50) {
  console.log(`Getting ${limit} recent audit logs`);

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      resource_type,
      resource_id,
      ip_address,
      created_at,
      user_id
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }

  console.log(`Retrieved ${data?.length || 0} audit logs`);
  return data || [];
}

async function trackFailedLogin(loginData: {
  email?: string;
  ipAddress: string;
  userAgent?: string;
}) {
  console.log('Tracking failed login attempt for IP:', loginData.ipAddress);

  // Check if there's an existing record
  const { data: existing } = await supabase
    .from('failed_login_attempts')
    .select('*')
    .eq('ip_address', loginData.ipAddress)
    .gte('last_attempt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within 24 hours
    .single();

  if (existing) {
    // Update existing record
    const newCount = existing.attempt_count + 1;
    const shouldBlock = newCount >= 5; // Block after 5 failed attempts

    const { error } = await supabase
      .from('failed_login_attempts')
      .update({
        attempt_count: newCount,
        last_attempt: new Date().toISOString(),
        blocked_until: shouldBlock ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null, // Block for 1 hour
        email: loginData.email || existing.email,
        user_agent: loginData.userAgent || existing.user_agent
      })
      .eq('id', existing.id);

    if (error) throw error;

    return { 
      attemptCount: newCount, 
      blocked: shouldBlock,
      blockedUntil: shouldBlock ? new Date(Date.now() + 60 * 60 * 1000) : null
    };
  } else {
    // Create new record
    const { error } = await supabase
      .from('failed_login_attempts')
      .insert({
        email: loginData.email,
        ip_address: loginData.ipAddress,
        user_agent: loginData.userAgent,
        attempt_count: 1
      });

    if (error) throw error;

    return { attemptCount: 1, blocked: false };
  }
}

async function checkRateLimit(requestData: {
  ipAddress: string;
  email?: string;
  type: 'application' | 'login';
}) {
  console.log('Checking rate limit for:', requestData);

  if (requestData.type === 'application') {
    // Check application rate limit
    const { data: existing } = await supabase
      .from('application_rate_limits')
      .select('*')
      .eq('ip_address', requestData.ipAddress)
      .gte('last_application', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existing) {
      const newCount = existing.application_count + 1;
      const shouldBlock = newCount > 3; // Allow max 3 applications per day

      if (!shouldBlock) {
        await supabase
          .from('application_rate_limits')
          .update({
            application_count: newCount,
            last_application: new Date().toISOString()
          })
          .eq('id', existing.id);
      }

      return {
        allowed: !shouldBlock,
        count: newCount,
        limit: 3,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    } else {
      // First application from this IP
      await supabase
        .from('application_rate_limits')
        .insert({
          ip_address: requestData.ipAddress,
          email: requestData.email,
          application_count: 1
        });

      return { allowed: true, count: 1, limit: 3 };
    }
  }

  return { allowed: true };
}

async function cleanupExpiredSessions() {
  console.log('Cleaning up expired sessions');

  const { data, error } = await supabase
    .from('user_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error cleaning up sessions:', error);
    throw error;
  }

  console.log('Expired sessions cleaned up');
  return { cleaned: true };
}

async function getSecurityStats() {
  console.log('Getting security statistics');

  // Get recent audit logs count
  const { count: auditCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Get failed login attempts count
  const { count: failedLoginsCount } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact', head: true })
    .gte('last_attempt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Get active sessions count
  const { count: activeSessionsCount } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('expires_at', new Date().toISOString());

  // Get blocked IPs count
  const { count: blockedIpsCount } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact', head: true })
    .not('blocked_until', 'is', null)
    .gte('blocked_until', new Date().toISOString());

  return {
    auditEvents24h: auditCount || 0,
    failedLogins24h: failedLoginsCount || 0,
    activeSessions: activeSessionsCount || 0,
    blockedIps: blockedIpsCount || 0
  };
}