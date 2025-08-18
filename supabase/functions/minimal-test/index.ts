import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve((req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: "Minimal test working",
    method: req.method 
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
});