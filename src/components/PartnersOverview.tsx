import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, ExternalLink, Calendar, Globe } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  is_active: boolean;
  description?: string;
  website_url?: string;
  discount_code?: string;
  created_at: string;
}

interface PartnersOverviewProps {
  partners?: Partner[];
}

export function PartnersOverview({ partners: propPartners }: PartnersOverviewProps) {
  const [partners, setPartners] = useState<Partner[]>(propPartners || []);
  const [loading, setLoading] = useState(!propPartners);

  useEffect(() => {
    if (!propPartners) {
      fetchPartners();
    }
  }, [propPartners]);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, is_active, description, website_url, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  const activePartners = partners.filter(p => p.is_active);
  const totalPartners = partners.length;
  const recentPartners = partners.slice(0, 3);
  const partnersWithWebsite = partners.filter(p => p.website_url && p.is_active).length;

  if (loading) {
    return (
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Partners</CardTitle>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gaming-dark rounded mb-2"></div>
            <div className="h-4 bg-gaming-dark rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gaming-card border-gaming-border hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">Partners</CardTitle>
        <ExternalLink className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-foreground mb-2">
              {activePartners.length}
              <span className="text-muted-foreground text-sm font-normal ml-1">
                / {totalPartners}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={activePartners.length > 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {activePartners.length > 0 ? "Active" : "None Active"}
              </Badge>
              {partnersWithWebsite > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {partnersWithWebsite} with sites
                </Badge>
              )}
            </div>
          </div>

          {recentPartners.length > 0 && (
            <div className="border-t border-gaming-border pt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Recent Partners
              </h4>
              <div className="space-y-1">
                {recentPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between">
                    <span className="text-xs text-foreground truncate max-w-24">
                      {partner.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {partner.website_url && (
                        <Globe className="h-3 w-3 text-primary" />
                      )}
                      <Badge 
                        variant={partner.is_active ? "default" : "secondary"} 
                        className="text-[10px] px-1 py-0"
                      >
                        {partner.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {activePartners.length === 0 
              ? "No active partnerships" 
              : `${activePartners.length} active partnership${activePartners.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}