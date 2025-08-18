import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Processing simple test request...");
    
    const requestBody = await req.json().catch(() => ({}));
    console.log("Request body:", requestBody);
    
    // Simple test response without external dependencies
    const response = {
      success: true,
      message: "Simple test function is working!",
      timestamp: new Date().toISOString(),
      environment: {
        hasResendKey: !!Deno.env.get("RESEND_API_KEY"),
        resendKeyLength: Deno.env.get("RESEND_API_KEY")?.length || 0
      }
    };
    
    console.log("Sending response:", response);
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  }
});