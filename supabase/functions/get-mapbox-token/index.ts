import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Getting Mapbox token from secrets...");

    // Get the Mapbox token from Supabase secrets
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    if (!mapboxToken) {
      console.log("No Mapbox token found in secrets");
      return new Response(
        JSON.stringify({ 
          error: "Mapbox token not configured",
          token: null 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Mapbox token found and returned");

    return new Response(
      JSON.stringify({ 
        token: mapboxToken,
        success: true 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error getting Mapbox token:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        token: null
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);