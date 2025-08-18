import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Shield, Users, Car, Heart, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Rules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'General Rules': return Shield;
      case 'Roleplay Rules': return Users;
      case 'Crime & Police': return Car;
      case 'EMS & Medical': return Heart;
      default: return Shield;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'General Rules': return 'text-neon-purple';
      case 'Roleplay Rules': return 'text-neon-blue';
      case 'Crime & Police': return 'text-neon-green';
      case 'EMS & Medical': return 'text-red-400';
      default: return 'text-neon-purple';
    }
  };

  // Group rules by category
  const ruleCategories = rules.reduce((acc: any, rule: any) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
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
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Server Rules
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow these rules to ensure everyone has an amazing roleplay experience. 
            Violations may result in warnings, kicks, or permanent bans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(ruleCategories).map(([categoryName, categoryRules]: [string, any]) => {
            const IconComponent = getCategoryIcon(categoryName);
            const color = getCategoryColor(categoryName);
            
            return (
              <Card key={categoryName} className="p-6 bg-gaming-card border-gaming-border shadow-gaming hover:border-neon-purple/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <IconComponent className={`h-6 w-6 ${color}`} />
                  <h2 className="text-xl font-semibold text-foreground">{categoryName}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {categoryRules.length} rules
                  </Badge>
                </div>
                
                <ul className="space-y-3">
                  {categoryRules.map((rule: any) => (
                    <li key={rule.id} className="flex items-start space-x-2">
                      <span className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} mt-2 flex-shrink-0`} />
                      <div>
                        <div className="text-sm font-medium text-foreground">{rule.title}</div>
                        <div className="text-muted-foreground text-sm leading-relaxed">{rule.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {Object.keys(ruleCategories).length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No rules found. Contact staff to add server rules.</p>
          </div>
        )}

        <Card className="mt-8 p-6 bg-gaming-card border-gaming-border shadow-gaming">
          <h2 className="text-xl font-semibold text-foreground mb-4">Important Notes</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>• Staff decisions are final. Respect their authority and follow their instructions.</p>
            <p>• Report rule violations through Discord or in-game reporting system.</p>
            <p>• Ignorance of the rules is not an excuse. It's your responsibility to stay updated.</p>
            <p>• Rules may be updated periodically. Check back regularly for changes.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Rules;