import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-[#181b25] to-gaming-dark">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-14">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-neon-blue via-neon-purple to-neon-orange bg-clip-text text-transparent drop-shadow-lg animate-fade-in">
            Adventure RP <span className="block text-2xl md:text-3xl font-semibold text-foreground mt-1">Premium FiveM Partners</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mt-4 mb-2">
            Oplev vores eksklusive samarbejdspartnere, der bidrager til et endnu stærkere og sjovere RP-fællesskab.
          </p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading partners...</p>
            </div>
          </div>
        ) : partners.length > 0 ? (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="bg-gradient-to-br from-[#26294b] via-[#20223a] to-[#31325e] border-none shadow-lg group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2 font-extrabold group-hover:text-neon-purple transition-colors text-white">
                        {partner.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <span
                          className="uppercase tracking-widest font-bold text-lg px-4 py-1 rounded bg-blue-600/90 text-white shadow border-2 border-blue-400"
                          style={{
                            letterSpacing: "0.04em",
                            boxShadow: "0 2px 8px #152a4588"
                          }}
                        >
                          Partner
                        </span>
                      {partner.discount_code && (
                        <span className="flex items-center gap-0.5 ml-1">
                          <span
                            className="font-bold text-base px-4 py-1 rounded bg-green-600/90 text-white shadow border-2 border-green-400 flex items-center tracking-wider"
                            style={{
                              letterSpacing: "0.06em",
                              boxShadow: "0 2px 10px #1ecb7a30",
                              userSelect: "all"
                            }}
                          >
                            Rabatkode:&nbsp;
                            <span className="font-mono text-lg mr-2 select-all">{partner.discount_code}</span>
                            <button
                              onClick={() => handleCopy(partner.discount_code!, partner.id)}
                              className="hover:scale-110 transition-all ml-1 text-white"
                              title="Kopier rabatkode"
                              type="button"
                              aria-label="Kopier rabatkode"
                            >
                              <Copy className="inline w-4 h-4" />
                            </button>
                          </span>
                          {copied === partner.id && (
                            <span className="ml-2 text-green-400 font-medium text-xs">Kopieret!</span>
                          )}
                        </span>
                      )}
                      </div>
                    </div>
                    {partner.logo_url && (
                      <div className="ml-4 flex-shrink-0">
                        <img 
                          src={partner.logo_url} 
                          alt={`${partner.name} logo`}
                          className="w-16 h-16 object-contain rounded-xl bg-background/10 p-2 shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {partner.description && (
                    <p className="text-muted-foreground mb-3 leading-relaxed text-[15px] group-hover:text-foreground">
                      {partner.description}
                    </p>
                  )}
                  {partner.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-neon-blue group-hover:text-white transition-all font-bold mt-3"
                      asChild
                    >
                      <a 
                        href={partner.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Besøg hjemmeside
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gaming-card border-gaming-border rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-foreground">Ingen partnere endnu</h3>
            <p className="text-muted-foreground">
              Vi arbejder på flere stærke samarbejder – følg med!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
