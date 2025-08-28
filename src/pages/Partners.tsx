import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, CheckCircle, Star, Zap, Trophy, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  order_index: number;
  discount_code?: string | null;
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  // Kopier rabatkode og vis kortvarig bekræftelse
  const handleCopy = async (code: string, partnerId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(partnerId);
      setTimeout(() => setCopied(null), 1200);
    } catch (err) {
      // evt. fallback her
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background with cyberpunk grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-gaming-dark via-gaming-darker to-gaming-dark"></div>
      <div className="absolute inset-0 cyber-grid opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark/50 via-transparent to-gaming-dark/50"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${18 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <main className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="text-center mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-3xl -z-10"></div>
            
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gaming-card border border-gaming-border rounded-full">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Elite Partnership Network</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg text-glow">
                Adventure RP
              </span>
              <span className="block text-3xl md:text-4xl font-bold text-foreground mt-2 animate-slide-up">
                <Zap className="inline w-8 h-8 mr-2 text-primary" />
                Premium Partners
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Discover our exclusive partnership network. Elite collaborations that elevate the entire RP experience with premium benefits and exclusive offers.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gaming-card/50 backdrop-blur-sm border border-gaming-border rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Verified Partners</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gaming-card/50 backdrop-blur-sm border border-gaming-border rounded-lg">
                <Star className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Exclusive Benefits</span>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-glow-primary"></div>
                <p className="text-lg text-muted-foreground">Loading elite partners...</p>
              </div>
            </div>
          ) : partners.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner, index) => (
                <div
                  key={partner.id}
                  className="group animate-fade-in hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="card-gaming-outline bg-gradient-card border-2 border-gaming-border hover:border-primary/50 overflow-hidden relative">
                    {/* Glowing border effect */}
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                    
                    {/* Premium badge for partners with discount codes */}
                    {partner.discount_code && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="badge-cyber">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                            {partner.name}
                          </CardTitle>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge className="bg-gradient-primary text-primary-foreground font-semibold border-0 shadow-neon">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified Partner
                            </Badge>
                          </div>
                        </div>
                        
                        {partner.logo_url && (
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gaming-card border border-gaming-border rounded-xl p-2 group-hover:border-primary/50 transition-colors duration-300 shadow-gaming">
                              <img 
                                src={partner.logo_url} 
                                alt={`${partner.name} logo`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 relative z-10">
                      {partner.description && (
                        <p className="text-muted-foreground mb-6 leading-relaxed group-hover:text-foreground transition-colors duration-300">
                          {partner.description}
                        </p>
                      )}
                      
                      {/* Discount code section */}
                      {partner.discount_code && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-gaming-card to-gaming-dark border border-gaming-border rounded-lg relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4 text-secondary" />
                              <span className="text-sm font-medium text-secondary">Exclusive Discount</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <code className="text-lg font-mono font-bold text-primary bg-gaming-dark px-3 py-2 rounded border border-gaming-border">
                                  {partner.discount_code}
                                </code>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleCopy(partner.discount_code!, partner.id)}
                                className="bg-gradient-primary hover:opacity-90 border-0 shadow-glow-primary"
                              >
                                {copied === partner.id ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Website button */}
                      {partner.website_url && (
                        <Button
                          className="w-full bg-gaming-card hover:bg-gradient-primary border border-gaming-border hover:border-primary/50 hover:shadow-glow-primary transition-all duration-300"
                          asChild
                        >
                          <a 
                            href={partner.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit Website
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gaming-card border-2 border-gaming-border rounded-full mx-auto mb-6 shadow-gaming">
                <ExternalLink className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">Building Elite Partnerships</h3>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                We're curating exclusive partnerships to enhance your Adventure RP experience. Stay tuned for amazing collaborations!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
