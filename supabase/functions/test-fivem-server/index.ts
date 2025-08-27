import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { serverIp, port = 30121 } = await req.json();
    
    if (!serverIp) {
      return new Response(
        JSON.stringify({ error: 'Server IP is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Testing FiveM server endpoints at ${serverIp}:${port}`);

    // Helper function to fetch with timeout and better error handling
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Supabase-Edge-Function/1.0'
          }
        });
        clearTimeout(timeoutId);
        return { success: true, response, error: null };
      } catch (error) {
        clearTimeout(timeoutId);
        return { success: false, response: null, error: error.message };
      }
    };

    // Test various FiveM endpoints
    const baseUrl = `http://${serverIp}:${port}`;
    const endpoints = [
      '/players.json',
      '/info.json', 
      '/dynamic.json',
      '/', // Basic server check
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      const url = baseUrl + endpoint;
      console.log(`Testing endpoint: ${url}`);
      
      const result = await fetchWithTimeout(url);
      
      if (result.success && result.response) {
        try {
          const text = await result.response.text();
          let data = null;
          
          // Try to parse as JSON if possible
          if (endpoint !== '/') {
            try {
              data = JSON.parse(text);
            } catch {
              data = text.substring(0, 200); // First 200 chars if not JSON
            }
          } else {
            data = text.substring(0, 200); // First 200 chars for root endpoint
          }
          
          results[endpoint] = {
            status: 'success',
            statusCode: result.response.status,
            data: data
          };
        } catch (parseError) {
          results[endpoint] = {
            status: 'success_but_parse_error',
            statusCode: result.response.status,
            error: parseError.message
          };
        }
      } else {
        results[endpoint] = {
          status: 'failed',
          error: result.error
        };
      }
    }

    // Summary
    const successfulEndpoints = Object.entries(results).filter(([_, result]) => result.status === 'success').length;
    const serverResponding = successfulEndpoints > 0;

    console.log('Test results:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        serverResponding,
        successfulEndpoints,
        totalEndpoints: endpoints.length,
        results,
        recommendations: serverResponding 
          ? ["Server is responding! Check specific endpoints for data availability."]
          : [
              "Server is not responding to HTTP requests.",
              "Verify the server IP and port are correct.",
              "Check if the FiveM server has HTTP endpoints enabled.",
              "Ensure no firewall is blocking the requests."
            ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in test-fivem-server function:', error);
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