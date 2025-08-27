import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Package {
  id: string;
  name: string;
  description: string;
  price_amount: number;
  currency: string;
  interval: string;
  features: any;
  is_active: boolean;
  order_index: number;
}

interface Subscription {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  package_id: string | null;
}

export default function Packages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(5);

  useEffect(() => {
    fetchPackages();
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }

    // Handle success/payment confirmation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true" && user) {
      handlePaymentSuccess();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load packages");
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error("Failed to check subscription status");
    } finally {
      setCheckingSubscription(false);
      setLoading(false);
    }
  };

  const handleSubscribe = async (packageId: string) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packageId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start subscription process");
    }
  };

const handleCustomSubscribe = async (amount: number) => {
  if (!user) {
    toast.error("Please log in to support");
    return;
  }

  // Sikre value er et tal og minimum 1 usd
  const numericAmount = Math.max(1, Number(amount)); // Minimum $1

  if (isNaN(numericAmount) || numericAmount < 1) {
    toast.error("Enter an amount of at least $1");
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { customAmount: numericAmount },
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    } else {
      toast.error("No payment link returned from server!");
    }
  } catch (error) {
    // Vis evt. server-fejl til bruger for debugging
    console.error("Error creating custom checkout:", error);
    toast.error(
      error?.message
        ? `Failed to start custom payment process: ${error.message}`
        : "Failed to start custom payment process"
    );
  }
};


  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Failed to open subscription management");
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user?.id)
        .single();

      // Sikker reduce: Undgå tom array-fejl!
      let mostExpensivePackage: Package | null = null;
      if (packages.length > 0) {
        mostExpensivePackage = packages.reduce(
          (prev, current) => (prev.price_amount > current.price_amount ? prev : current)
        );
      }

      // Trigger purchase webhook kun hvis du har et pakkeobjekt
      if (mostExpensivePackage) {
        await supabase.functions.invoke("purchase-webhook", {
          body: {
            customerEmail: user?.email,
            customerName: profile?.username || user?.email,
            packageName: mostExpensivePackage?.name || "Unknown Package",
            price: mostExpensivePackage?.price_amount || 0,
            currency: mostExpensivePackage?.currency || "USD",
          },
        });
      } else {
        // Hvis customAmount: send fallback eller undlad at kalde webhook
        await supabase.functions.invoke("purchase-webhook", {
          body: {
            customerEmail: user?.email,
            customerName: profile?.username || user?.email,
            packageName: "Custom Payment",
            price: customAmount ? customAmount * 100 : 0,
            currency: "USD",
          },
        });
      }

      toast.success("Payment successful! Welcome to your new package!");
      window.history.replaceState({}, document.title, window.location.pathname);
      await checkSubscription();
    } catch (error) {
      console.error("Error handling payment success:", error);
      // Don't show error to user as payment was successful
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading packages...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Choose Your Package</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect subscription package for your gaming experience
          </p>
        </div>

        {user && subscription && (
          <div className="mb-8 p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Subscription Status</h3>
                <p className="text-muted-foreground">
                  {subscription.subscribed ? (
                    <>
                      Active: {subscription.subscription_tier}
                      {subscription.subscription_end && (
                        <span className="ml-2">
                          (expires {new Date(subscription.subscription_end).toLocaleDateString()})
                        </span>
                      )}
                    </>
                  ) : (
                    "No active subscription"
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={checkSubscription}
                  disabled={checkingSubscription}
                >
                  {checkingSubscription ? "Checking..." : "Refresh Status"}
                </Button>
                {subscription.subscribed && (
                  <Button onClick={handleManageSubscription}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const isCurrentPackage = subscription?.package_id === pkg.id;
            return (
              <Card key={pkg.id} className={`relative ${isCurrentPackage ? 'ring-2 ring-primary' : ''}`}>
                {isCurrentPackage && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-foreground">{pkg.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {pkg.description}
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary">
                    {formatPrice(pkg.price_amount, pkg.currency)}
                    <span className="text-base font-normal text-muted-foreground">
                      /{pkg.interval}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                    <ul className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center">No features listed</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={!user || isCurrentPackage}
                  >
                    {!user ? (
                      "Login to Subscribe"
                    ) : isCurrentPackage ? (
                      "Current Package"
                    ) : subscription?.subscribed ? (
                      "Switch Package"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {/* Custom Amount Card */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Custom Support</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose your own amount (min. $1)
              </CardDescription>
              <div className="text-4xl font-bold text-primary">
                ${customAmount}
                <span className="text-base font-normal text-muted-foreground">
                  /one-time
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="number"
                min={1}
                className="w-full border rounded-md px-3 py-2 text-foreground bg-background"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground text-center">
                Thank you for supporting us! 🙏
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleCustomSubscribe(customAmount)}
                disabled={!user || customAmount < 1}
              >
                {!user ? "Login to Support" : "Donate"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No packages available at the moment.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
