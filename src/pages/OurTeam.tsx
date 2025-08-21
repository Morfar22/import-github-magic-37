import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, Shield, Star, Calendar, TrendingUp, Activity, MapPin, Globe, Award, Heart } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image_url?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const dashboardStats = [
  {
    title: "Total Members",
    valueKey: "totalMembers",
    color: "hsl(217, 91%, 60%)", // Neon blue
    icon: Users,
  },
  {
    title: "Active Staff",
    valueKey: "activeMembers",
    color: "hsl(120, 100%, 50%)", // Neon green
    icon: Activity,
  },
  {
    title: "Avg Tenure (months)",
    valueKey: "avgTenure",
    color: "hsl(280, 100%, 70%)", // Neon purple
    icon: TrendingUp,
  },
  {
    title: "Leadership",
    valueKey: "adminCount+modCount",
    color: "hsl(48, 100%, 50%)", // Neon yellow
    icon: Crown,
  },
];

const OurTeam = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    adminCount: 0,
    modCount: 0,
    avgTenure: 0
  });
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  useEffect(() => {
    fetchTeamMembers();
    // eslint-disable-next-line
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }

      const members = data || [];
      setTeamMembers(members);

      // Calculate stats
      const activeMembers = members.filter(m => m.is_active);
      const adminCount = members.filter(m => m.role.toLowerCase().includes('admin') || m.role.toLowerCase().includes('owner')).length;
      const modCount = members.filter(m => m.role.toLowerCase().includes('moderator') || m.role.toLowerCase().includes('mod')).length;

      // Calculate average tenure (in months)
      const avgTenure = members.length > 0
        ? members.reduce((acc, member) => {
            const memberDate = new Date(member.created_at);
            const monthsDiff = (Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return acc + monthsDiff;
          }, 0) / members.length
        : 0;

      setStats({
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        adminCount,
        modCount,
        avgTenure: Math.round(avgTenure)
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('owner') || lowerRole.includes('founder')) return Crown;
    if (lowerRole.includes('admin')) return Star;
    if (lowerRole.includes('moderator') || lowerRole.includes('mod')) return Shield;
    return Users;
  };

  const getRoleColor = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('owner') || lowerRole.includes('founder')) return 'text-yellow-400 border-yellow-400/50';
    if (lowerRole.includes('admin')) return 'text-red-400 border-red-400/50';
    if (lowerRole.includes('moderator') || lowerRole.includes('mod')) return 'text-blue-400 border-blue-400/50';
    return 'text-green-400 border-green-400/50';
  };

  const getJoinedTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Our Team
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Meet the dedicated staff members who keep our community running smoothly
          </p>

          {/* Team Stats Cards (now glow and are fully responsive) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            {dashboardStats.map((stat, i) => {
              const IconComp = stat.icon;
              const value =
                stat.valueKey === "adminCount+modCount"
                  ? stats.adminCount + stats.modCount
                  : stats[stat.valueKey as keyof typeof stats];

              // Glow effect uses inline style instead of Tailwind + CSS variable approach
              const glowStyle =
                hoveredStat === i
                  ? {
                      borderColor: stat.color,
                      boxShadow: `0 0 22px 8px ${stat.color}`,
                    }
                  : {};

              return (
                <Card
                  key={stat.title}
                  className="bg-gaming-card/50 border border-solid backdrop-blur-sm transition-all duration-200 cursor-pointer"
                  style={glowStyle}
                  onMouseEnter={() => setHoveredStat(i)}
                  onMouseLeave={() => setHoveredStat(null)}
                >
                  <CardContent className="p-4 text-center">
                    <IconComp className="h-6 w-6 mx-auto mb-2" style={{ color: stat.color }} />
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-400">{stat.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Team Activity Status */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Team Activity</span>
              <span>{Math.round((stats.activeMembers / Math.max(stats.totalMembers, 1)) * 100)}% Active</span>
            </div>
            <Progress
              value={(stats.activeMembers / Math.max(stats.totalMembers, 1)) * 100}
              className="h-2 bg-gaming-card border border-gaming-border"
            />
          </div>
        </div>

        {/* Member cards, already glow on hover from your previous code */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-gaming-card border-gaming-border">
                <CardHeader className="text-center">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold text-white mb-4">
              No Team Members Yet
            </h3>
            <p className="text-gray-400">
              Team members will appear here once they're added by staff.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => {
              const RoleIcon = getRoleIcon(member.role);
              const roleColorClass = getRoleColor(member.role);

              return (
                <Card
                  key={member.id}
                  className="bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-purple/20 group animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="text-center relative">
                    {/* Status indicator */}
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${member.is_active ? 'bg-green-400' : 'bg-gray-500'} shadow-lg`} />
                    {/* Avatar with enhanced styling */}
                    <div className="relative">
                      <Avatar className="h-24 w-24 mx-auto mb-4 ring-2 ring-gaming-border group-hover:ring-neon-purple/50 transition-all duration-300">
                        <AvatarImage src={member.image_url} alt={member.name} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 text-white text-xl font-bold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Role icon overlay */}
                      <div className={`absolute -bottom-2 -right-2 p-2 rounded-full bg-gaming-dark border-2 ${roleColorClass.split(' ')[1]} shadow-lg`}>
                        <RoleIcon className={`h-4 w-4 ${roleColorClass.split(' ')}`} />
                      </div>
                    </div>
                    <CardTitle className="text-white text-lg mb-2 group-hover:text-neon-purple transition-colors">
                      {member.name}
                    </CardTitle>
                    <Badge variant="outline" className={`${roleColorClass} bg-transparent font-medium`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {member.role}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {member.bio && (
                      <CardDescription className="text-gray-400 text-center leading-relaxed">
                        {member.bio}
                      </CardDescription>
                    )}
                    {/* Member stats */}
                    <div className="flex items-center justify-center space-x-4 pt-2 border-t border-gaming-border/50">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {getJoinedTime(member.created_at)}</span>
                      </div>
                      {member.is_active && (
                        <div className="flex items-center space-x-1 text-xs text-green-400">
                          <Heart className="h-3 w-3" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                    {/* Social indicators (placeholder for future features) */}
                    <div className="flex justify-center space-x-2 pt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gaming-dark/50 px-2 py-1 rounded-full">
                        <Award className="h-3 w-3" />
                        <span>Staff</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OurTeam;
