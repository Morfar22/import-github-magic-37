import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Partner {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  order_index: number;
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Our Partners
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're proud to collaborate with these amazing organizations that help make our community even better.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading partners...</p>
            </div>
          </div>
        ) : partners.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <Card key={partner.id} className="bg-gaming-card border-gaming-border hover:border-primary/50 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                        {partner.name}
                      </CardTitle>
                      <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                        Partner
                      </Badge>
                    </div>
                    {partner.logo_url && (
                      <div className="ml-4">
                        <img 
                          src={partner.logo_url} 
                          alt={`${partner.name} logo`}
                          className="w-16 h-16 object-contain rounded-lg bg-background/10 p-2"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {partner.description && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {partner.description}
                    </p>
                  )}
                  
                  {partner.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gaming-card border-gaming-border rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Partners Yet</h3>
            <p className="text-muted-foreground">
              We're always looking for new partnerships. Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}