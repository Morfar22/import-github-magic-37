import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupporterBadge } from "@/components/SupporterBadge";
import Navbar from "@/components/Navbar";
import { Heart, Users, TrendingUp, Gift, Star, Crown, Diamond, Trophy, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Supporter {
  id: string;
  user_id: string;
  amount: number;
  supporter_tier: string;
  donation_date: string;
  message: string | null;
  is_anonymous: boolean;
  is_featured: boolean;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface SupporterStats {
  total_supporters: number;
  total_raised: number;
  top_tier_count: number;
}

export default function Supporters() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [featuredSupporters, setFeaturedSupporters] = useState<Supporter[]>([]);
  const [stats, setStats] = useState<SupporterStats>({ total_supporters: 0, total_raised: 0, top_tier_count: 0 });
  const [userSupporterStatus, setUserSupporterStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSupporters();
    fetchStats();
    if (user) {
      fetchUserStatus();
    }
  }, [user]);

  const fetchSupporters = async () => {
    try {
      const { data, error } = await supabase
        .from("supporters")
        .select(`
          id,
          user_id,
          amount,
          supporter_tier,
          donation_date,
          message,
          is_anonymous,
          is_featured,
          profiles!inner (
            username,
            avatar_url
          )
        `)
        .eq("is_anonymous", false)
        .order("amount", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as Supporter[];
      
      const featured = typedData.filter(s => s.is_featured);
      const regular = typedData.filter(s => !s.is_featured);
      
      setSupporters(regular);
      setFeaturedSupporters(featured);
    } catch (error) {
      console.error("Error fetching supporters:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("supporters")
        .select("amount, supporter_tier");

      if (error) throw error;

      const totalSupporters = data?.length || 0;
      const totalRaised = data?.reduce((sum, s) => sum + s.amount, 0) || 0;
      const topTierCount = data?.filter(s => ['diamond', 'platinum', 'gold'].includes(s.supporter_tier)).length || 0;

      setStats({
        total_supporters: totalSupporters,
        total_raised: totalRaised,
        top_tier_count: topTierCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUserStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_supporter_status', { check_user_id: user.id });

      if (error) throw error;
      setUserSupporterStatus(data?.[0] || null);
    } catch (error) {
      console.error("Error fetching user supporter status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = () => {
    // This would integrate with your payment system
    console.log("Opening donation flow...");
  };

  const tierStats = {
    diamond: supporters.filter(s => s.supporter_tier === 'diamond').length,
    platinum: supporters.filter(s => s.supporter_tier === 'platinum').length, 
    gold: supporters.filter(s => s.supporter_tier === 'gold').length,
    silver: supporters.filter(s => s.supporter_tier === 'silver').length,
    bronze: supporters.filter(s => s.supporter_tier === 'bronze').length
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gaming-dark via-gaming-darker to-gaming-dark"></div>
      <div className="absolute inset-0 cyber-grid opacity-20"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
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
          <section className="text-center mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-3xl -z-10"></div>
            
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gaming-card border border-gaming-border rounded-full">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">Community Support</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg text-glow">
                Our Amazing
              </span>
              <span className="block text-3xl md:text-4xl font-bold text-foreground mt-2 animate-slide-up">
                <Heart className="inline w-8 h-8 mr-2 text-red-500" />
                Supporters
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Thanks to our incredible supporters, Adventure RP continues to grow and provide the best roleplay experience. 
              Join our supporter family and get exclusive perks!
            </p>

            {!loading && userSupporterStatus?.is_supporter && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gaming-card border-2 border-primary/50 rounded-xl shadow-glow-primary">
                  <Crown className="w-6 h-6 text-primary" />
                  <span className="text-lg font-semibold text-foreground">Thank you for your support!</span>
                  <SupporterBadge 
                    tier={userSupporterStatus.tier} 
                    totalDonated={userSupporterStatus.total_donated}
                    showAmount={true}
                    size="lg"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Stats Cards */}
          <section className="grid gap-6 md:grid-cols-3 mb-16">
            <Card className="card-gaming-outline bg-gradient-card border-gaming-border hover:border-primary/50 transition-all duration-300 text-center">
              <CardHeader className="pb-3">
                <Users className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold text-foreground">
                  {stats.total_supporters}
                </CardTitle>
                <p className="text-muted-foreground">Total Supporters</p>
              </CardHeader>
            </Card>

            <Card className="card-gaming-outline bg-gradient-card border-gaming-border hover:border-secondary/50 transition-all duration-300 text-center">
              <CardHeader className="pb-3">
                <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold text-foreground">
                  ${(stats.total_raised / 100).toFixed(0)}
                </CardTitle>
                <p className="text-muted-foreground">Total Raised</p>
              </CardHeader>
            </Card>

            <Card className="card-gaming-outline bg-gradient-card border-gaming-border hover:border-accent/50 transition-all duration-300 text-center">
              <CardHeader className="pb-3">
                <Crown className="w-10 h-10 text-accent mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold text-foreground">
                  {stats.top_tier_count}
                </CardTitle>
                <p className="text-muted-foreground">Elite Supporters</p>
              </CardHeader>
            </Card>
          </section>

          {/* Supporter Tiers Info */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Supporter Tiers</h2>
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { tier: 'diamond', icon: Diamond, count: tierStats.diamond, amount: '$500+' },
                { tier: 'platinum', icon: Crown, count: tierStats.platinum, amount: '$250+' },
                { tier: 'gold', icon: Trophy, count: tierStats.gold, amount: '$100+' },
                { tier: 'silver', icon: Star, count: tierStats.silver, amount: '$50+' },
                { tier: 'bronze', icon: Medal, count: tierStats.bronze, amount: '$5+' }
              ].map(({ tier, icon: Icon, count, amount }) => (
                <Card key={tier} className="card-gaming-outline bg-gradient-card border-gaming-border text-center">
                  <CardContent className="pt-6">
                    <Icon className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <SupporterBadge tier={tier} size="sm" className="mb-2" />
                    <p className="text-sm text-muted-foreground">{amount}</p>
                    <p className="text-lg font-bold text-foreground">{count} supporters</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Featured Supporters */}
          {featuredSupporters.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Featured Supporters</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {featuredSupporters.map((supporter) => (
                  <Card key={supporter.id} className="card-gaming-outline bg-gradient-card border-primary/50 hover:border-primary transition-all duration-300">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-gaming-card border-2 border-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                        {supporter.profiles?.avatar_url ? (
                          <img 
                            src={supporter.profiles.avatar_url} 
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Heart className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <CardTitle className="text-foreground">
                        {supporter.profiles?.username || 'Anonymous Supporter'}
                      </CardTitle>
                      <SupporterBadge tier={supporter.supporter_tier} />
                    </CardHeader>
                    <CardContent>
                      {supporter.message && (
                        <p className="text-muted-foreground italic text-center">
                          "{supporter.message}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* All Supporters Wall */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Supporter Wall</h2>
            {supporters.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {supporters.map((supporter) => (
                  <Card key={supporter.id} className="card-gaming-outline bg-gradient-card border-gaming-border hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gaming-card border border-gaming-border rounded-full flex items-center justify-center">
                          {supporter.profiles?.avatar_url ? (
                            <img 
                              src={supporter.profiles.avatar_url} 
                              alt="Avatar"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Heart className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {supporter.profiles?.username || 'Anonymous'}
                          </p>
                          <SupporterBadge tier={supporter.supporter_tier} size="sm" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">Be the first to support Adventure RP!</p>
              </div>
            )}
          </section>

          {/* Call to Action */}
          <section className="text-center">
            <Card className="card-gaming-outline bg-gradient-card border-primary/50 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">Become a Supporter</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Support Adventure RP and help us create the best roleplay experience. 
                  Get exclusive perks, special recognition, and our eternal gratitude!
                </p>
                <Button 
                  onClick={handleDonate}
                  className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-3 shadow-glow-primary"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Support Adventure RP
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}