import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Scale, DollarSign, Clock, Shield, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Law {
  id: string;
  title: string;
  description: string;
  category: string;
  fine_amount: number;
  jail_time_minutes: number;
  severity_level: string;
  order_index: number;
}

const Laws = () => {
  const { user } = useAuth();
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLaws();
  }, []);

  const fetchLaws = async () => {
    try {
      const { data, error } = await supabase
        .from('laws')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('order_index');

      if (error) {
        console.error('Error fetching laws:', error);
        return;
      }

      const fetchedLaws = data || [];
      setLaws(fetchedLaws);

      // Find alle unikke kategorier
      const uniqueCategories = [...new Set(fetchedLaws.map(law => law.category))];
      setCategories(uniqueCategories);

      // Init state så alle starter collapsed
      setExpandedCategories(Object.fromEntries(uniqueCategories.map(cat => [cat, false])));
    } catch (error) {
      console.error('Error fetching laws:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category], // Toggle on each click
    }));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'moderate':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'severe':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatJailTime = (minutes: number) => {
    if (minutes === 0) return 'No jail time';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 
      ? `${hours} hour${hours !== 1 ? 's' : ''}` 
      : `${hours}h ${remainingMinutes}m`;
  };

  const formatFine = (amount: number) => {
    if (amount === 0) return 'No fine';
    return `$${amount.toLocaleString()}`;
  };

  const groupedLaws = laws.reduce((acc, law) => {
    if (!acc[law.category]) {
      acc[law.category] = [];
    }
    acc[law.category].push(law);
    return acc;
  }, {} as Record<string, Law[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          {/* Skeleton cards */}
          <div className="grid gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gaming-card border-gaming-border">
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <div className="flex gap-4">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />
      <div className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale className="h-12 w-12 text-neon-purple" />
              <h1 className="text-4xl font-bold text-foreground">City Laws</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Official legislation and penalties for our city. All citizens are expected to know and follow these laws.
            </p>
          </div>

          <div className="grid gap-8">
            {categories.map((category) => (
              <Card key={category} className="bg-gaming-card border-gaming-border">
                <CardHeader
                  onClick={() => toggleCategory(category)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                      <Scale className="h-6 w-6 text-neon-purple" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      {groupedLaws[category]?.length || 0} law{groupedLaws[category]?.length !== 1 ? 's' : ''} in this category
                    </CardDescription>
                  </div>
                  {expandedCategories[category] ? (
                    <ChevronDown className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  )}
                </CardHeader>

                {expandedCategories[category] && (
                  <CardContent>
                    <div className="space-y-6">
                      {groupedLaws[category]?.map((law, index) => (
                        <div key={law.id}>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="text-lg font-semibold text-foreground">{law.title}</h3>
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(law.severity_level)}
                                <Badge className={getSeverityColor(law.severity_level)}>
                                  {law.severity_level}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{law.description}</p>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Fine:</span>
                                <span className="text-foreground">{formatFine(law.fine_amount)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">Jail Time:</span>
                                <span className="text-foreground">{formatJailTime(law.jail_time_minutes)}</span>
                              </div>
                            </div>
                          </div>
                          {index < groupedLaws[category].length - 1 && <Separator className="mt-6" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laws;
