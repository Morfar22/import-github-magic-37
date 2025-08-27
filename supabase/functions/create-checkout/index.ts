import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Supabase client: BRUG SERVICE ROLE KEY (ikke ANON KEY)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { packageId, customAmount } = body;

    // Origin for redirect
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let session;

    if (customAmount) {
      // Hvis customAmount (engangsdonation/payment mode)
      const amountInCents = Math.round(Number(customAmount) * 100);
      if (isNaN(amountInCents) || amountInCents < 100) {
        throw new Error("Minimum amount is $1");
      }
      logStep("Custom amount checkout", { customAmount, amountInCents });

      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Custom Support",
                description: "User defined contribution"
              },
              unit_amount: amountInCents
            },
            quantity: 1
          }
        ],
        customer_email: user.email,
        success_url: `${origin}/packages?success=true`,
        cancel_url: `${origin}/packages?canceled=true`
      });
      logStep("Checkout session created (custom amount)", { sessionId: session.id, url: session.url });
    } else if (packageId) {
      // Hvis packageId (abonnement)
      logStep("Package checkout", { packageId });

      // Get package details from db
      const { data: packageData, error: packageError } = await supabaseClient
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .eq("is_active", true)
        .single();

      if (packageError || !packageData) {
        throw new Error("Package not found or inactive");
      }
      logStep("Package found", { packageName: packageData.name, price: packageData.price_amount });

      // Find Stripe customer (optional, kan også bare sende email)
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        logStep("No existing customer found, will use customer_email");
      }

      // Create checkout session
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: packageData.currency,
              product_data: {
                name: packageData.name,
                description: packageData.description || undefined
              },
              unit_amount: packageData.price_amount,
              recurring: {
                interval: packageData.interval
              }
            },
            quantity: 1
          }
        ],
        mode: "subscription",
        success_url: `${origin}/packages?success=true`,
        cancel_url: `${origin}/packages?canceled=true`
      });
      logStep("Checkout session created (package)", { sessionId: session.id, url: session.url });
    } else {
      throw new Error("No packageId or customAmount provided");
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
