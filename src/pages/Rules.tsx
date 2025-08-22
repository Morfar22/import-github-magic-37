import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Shield, Users, Car, Heart, AlertCircle, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Rules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("rules")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Server Regler":
      case "General Rules":
        return Shield;
      case "Allow List":
        return Users;
      case "Crime & Police":
        return Car;
      case "EMS & Medical":
        return Heart;
      case "Bande Regler":
        return Users;
      default:
        return Shield;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Server Regler":
      case "General Rules":
        return "text-neon-purple";
      case "Allow List":
      case "Bande Regler":
        return "text-neon-blue";
      case "Crime & Police":
        return "text-neon-green";
      case "EMS & Medical":
        return "text-red-400";
      default:
        return "text-neon-purple";
    }
  };

  // Group rules by category
  const ruleCategories = rules.reduce((acc: any, rule: any) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">Server Rules</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Følg reglerne for at sikre den bedste RP-oplevelse for alle.<br />
            Staff kan opdatere regler dynamisk via panel!
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(ruleCategories).map(([categoryName, categoryRules]: [string, any]) => {
            const IconComponent = getCategoryIcon(categoryName);
            const color = getCategoryColor(categoryName);

            const isOpen = openCategory === categoryName;

            return (
              <Card key={categoryName} className="p-0 bg-gaming-card border-gaming-border shadow-gaming transition-all duration-300">
                <button
                  type="button"
                  className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gaming-border/20 transition-colors"
                  onClick={() => setOpenCategory(isOpen ? null : categoryName)}
                  aria-expanded={isOpen}
                  aria-controls={`category-panel-${categoryName}`}
                >
                  <IconComponent className={`h-6 w-6 ${color} mr-2`} />
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">{categoryName}</h2>
                  <Badge variant="secondary" className="ml-3">{categoryRules.length} regler</Badge>
                  <ChevronDown className={`ml-auto h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                </button>

                {isOpen && (
                  <div
                    id={`category-panel-${categoryName}`}
                    className="px-6 pb-6 animate-fade-in"
                    role="region"
                  >
                    <ul className="space-y-4 mt-2">
                      {categoryRules.map((rule: any) => (
                        <li key={rule.id} className="flex items-start space-x-2">
                          <span className={`w-2 h-2 rounded-full ${color.replace("text-", "bg-")} mt-2 flex-shrink-0`} />
                          <div>
                            <div className="text-base font-medium text-foreground">{rule.title}</div>
                            <div className="text-muted-foreground text-sm">{rule.description}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {Object.keys(ruleCategories).length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen regler fundet. Kontakt staff for at oprette server regler.</p>
          </div>
        )}

        <Card className="mt-8 p-6 bg-gaming-card border-gaming-border shadow-gaming">
          <h2 className="text-xl font-semibold text-foreground mb-4">Vigtige Noter</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>• Staff beslutninger er endelige. Respektér deres autoritet.</p>
            <p>• Rapportér regelbrud via Discord/support.</p>
            <p>• Ignorance er ikke en undskyldning. Hold dig opdateret.</p>
            <p>• Regler opdateres løbende. Tjek ofte for ændringer.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Rules;
