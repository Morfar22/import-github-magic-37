import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting bulk server stats update');

    // Get all active servers
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('*')
      .eq('is_active', true);

    if (serversError) {
      console.error('Error fetching servers:', serversError);
      throw serversError;
    }

    if (!servers || servers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No active servers found',
          success: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${servers.length} active servers to update`);

    // Process all servers in parallel
    const results = await Promise.allSettled(
      servers.map(async (server) => {
        try {
          const response = await supabase.functions.invoke('fetch-individual-server-stats', {
            body: { 
              serverId: server.id, 
              serverIp: server.ip_address, 
              port: server.port 
            }
          });

          if (response.error) {
            console.error(`Error updating server ${server.name}:`, response.error);
            return { serverId: server.id, success: false, error: response.error };
          }

          return { serverId: server.id, success: true, data: response.data };
        } catch (error) {
          console.error(`Exception updating server ${server.name}:`, error);
          return { serverId: server.id, success: false, error: error.message };
        }
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Update completed: ${successful} successful, ${failed} failed`);

    // Update the general server_stats table with aggregated data
    try {
      // Get latest individual stats to calculate aggregated stats
      const { data: allStats } = await supabase
        .from('individual_server_stats')
        .select('*');

      if (allStats && allStats.length > 0) {
        const totalPlayers = allStats.reduce((sum, stat) => sum + (stat.players_online || 0), 0);
        const totalMaxPlayers = allStats.reduce((sum, stat) => sum + (stat.max_players || 0), 0);
        const avgUptime = allStats.reduce((sum, stat) => sum + (stat.uptime_percentage || 0), 0) / allStats.length;
        const avgPing = allStats.reduce((sum, stat) => sum + (stat.ping_ms || 0), 0) / allStats.length;
        const serverOnline = allStats.some(stat => stat.server_online);

        // Update or insert aggregated stats
        const { error: aggregateError } = await supabase
          .from('server_stats')
          .upsert({
            id: '90023225-8441-4679-b91d-3349e68f828f', // Use existing ID
            players_online: totalPlayers,
            max_players: totalMaxPlayers,
            uptime_percentage: Math.round(avgUptime * 10) / 10,
            ping_ms: Math.round(avgPing),
            server_online: serverOnline,
            last_updated: new Date().toISOString()
          });

        if (aggregateError) {
          console.error('Error updating aggregate stats:', aggregateError);
        } else {
          console.log('Updated aggregate server stats');
        }
      }
    } catch (error) {
      console.error('Error calculating aggregate stats:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Updated ${successful} servers successfully, ${failed} failed`,
        serversProcessed: results.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in update-all-server-stats function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});