import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get server IP from settings
    const { data: serverIpSetting } = await supabase
      .from('server_settings')
      .select('setting_value')
      .eq('setting_key', 'server_ip')
      .maybeSingle()

    if (!serverIpSetting?.setting_value) {
      return new Response(
        JSON.stringify({ error: 'Server IP not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const serverIp = serverIpSetting.setting_value as string
    console.log('Fetching stats from server:', serverIp)

    // Fetch server data from FiveM endpoints
    const [playersResponse, infoResponse, dynamicResponse] = await Promise.allSettled([
      fetch(`http://${serverIp}/players.json`, { 
        method: 'GET',
        headers: { 'User-Agent': 'Dreamlight-RP-Stats' }
      }),
      fetch(`http://${serverIp}/info.json`, { 
        method: 'GET',
        headers: { 'User-Agent': 'Dreamlight-RP-Stats' }
      }),
      fetch(`http://${serverIp}/dynamic.json`, { 
        method: 'GET',
        headers: { 'User-Agent': 'Dreamlight-RP-Stats' }
      })
    ])

    let playersOnline = 0
    let maxPlayers = 300
    let queueCount = 0

    // Parse players data
    if (playersResponse.status === 'fulfilled' && playersResponse.value.ok) {
      try {
        const playersData = await playersResponse.value.json()
        playersOnline = Array.isArray(playersData) ? playersData.length : 0
        console.log('Players online:', playersOnline)
      } catch (error) {
        console.error('Error parsing players data:', error)
      }
    }

    // Parse server info
    if (infoResponse.status === 'fulfilled' && infoResponse.value.ok) {
      try {
        const infoData = await infoResponse.value.json()
        maxPlayers = infoData.vars?.sv_maxClients || infoData.maxPlayers || 300
        console.log('Max players:', maxPlayers)
      } catch (error) {
        console.error('Error parsing info data:', error)
      }
    }

    // Parse dynamic data (for queue and other stats)
    if (dynamicResponse.status === 'fulfilled' && dynamicResponse.value.ok) {
      try {
        const dynamicData = await dynamicResponse.value.json()
        // Some servers expose queue data in dynamic.json
        queueCount = dynamicData.queue || 0
        console.log('Queue count:', queueCount)
      } catch (error) {
        console.error('Error parsing dynamic data:', error)
      }
    }

    // Calculate uptime (simplified - you might want to track this differently)
    const uptimePercentage = playersResponse.status === 'fulfilled' && playersResponse.value.ok ? 99.9 : 0.0

    // Simulate ping (you might want to measure actual ping)
    const pingMs = Math.floor(Math.random() * 30) + 10 // 10-40ms range

    console.log('Updating database with stats:', {
      playersOnline,
      maxPlayers,
      queueCount,
      uptimePercentage,
      pingMs
    })

    // Update the server_stats table
    const { error: updateError } = await supabase
      .from('server_stats')
      .update({
        players_online: playersOnline,
        max_players: maxPlayers,
        queue_count: queueCount,
        uptime_percentage: uptimePercentage,
        ping_ms: pingMs,
        last_updated: new Date().toISOString()
      })
      .eq('id', (await supabase.from('server_stats').select('id').limit(1).single()).data?.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update database', details: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const result = {
      success: true,
      stats: {
        players_online: playersOnline,
        max_players: maxPlayers,
        queue_count: queueCount,
        uptime_percentage: uptimePercentage,
        ping_ms: pingMs,
        last_updated: new Date().toISOString()
      }
    }

    console.log('Successfully updated server stats:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-server-stats function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})