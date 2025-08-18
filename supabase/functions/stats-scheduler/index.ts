import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('Stats scheduler triggered at:', new Date().toISOString())

  try {
    // Get the Supabase URL from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const functionUrl = `${supabaseUrl}/functions/v1/auto-fetch-server-stats`
    
    // Call the auto-fetch function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    console.log('Auto-fetch result:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Scheduled auto-fetch completed',
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in stats scheduler:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Scheduler error', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})