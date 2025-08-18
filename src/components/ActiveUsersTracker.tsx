import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Globe, Clock, RefreshCw, Eye, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActiveUser {
  user_id: string;
  username?: string;
  email?: string;
  role?: string;
  joined_at: string;
  last_seen: string;
  page?: string;
  device_type?: string;
  user_agent?: string;
}

const ActiveUsersTracker = () => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPresence, setUserPresence] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Join the presence channel
    const channel = supabase.channel('active-users-presence');

    // Track current user's presence
    const trackPresence = async () => {
      const userAgent = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      
      // Get user profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', user.id)
        .single();

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(1);

      const userStatus = {
        user_id: user.id,
        username: profile?.username || 'Anonymous',
        email: profile?.email || user.email,
        role: roleData?.[0]?.role || 'user',
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        page: window.location.pathname,
        device_type: isMobile ? 'mobile' : 'desktop',
        user_agent: userAgent.substring(0, 100) // Limit length
      };

      setUserPresence(userStatus);
      
      // Track presence in Supabase
      await channel.track(userStatus);
    };

    // Set up presence listeners
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: ActiveUser[] = [];
        
        Object.keys(presenceState).forEach(userId => {
          const presences = presenceState[userId];
          if (presences && presences.length > 0) {
            // Filter out invalid presence entries and ensure they have required fields
            const validPresences = presences.filter((presence: any) => 
              presence && 
              typeof presence === 'object' && 
              presence.user_id &&
              presence.joined_at &&
              presence.last_seen
            );
            
            if (validPresences.length > 0) {
              users.push(validPresences[0] as unknown as ActiveUser);
            }
          }
        });
        
        setActiveUsers(users);
        setIsLoading(false);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await trackPresence();
        }
      });

    // Update presence every 30 seconds
    const presenceInterval = setInterval(async () => {
      if (userPresence) {
        const updatedPresence = {
          ...userPresence,
          last_seen: new Date().toISOString(),
          page: window.location.pathname
        };
        setUserPresence(updatedPresence);
        await channel.track(updatedPresence);
      }
    }, 30000);

    // Update presence when page changes
    const handlePageChange = async () => {
      if (userPresence) {
        const updatedPresence = {
          ...userPresence,
          last_seen: new Date().toISOString(),
          page: window.location.pathname
        };
        setUserPresence(updatedPresence);
        await channel.track(updatedPresence);
      }
    };

    // Listen for page changes
    window.addEventListener('popstate', handlePageChange);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('popstate', handlePageChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const refreshPresence = async () => {
    setIsLoading(true);
    try {
      // Force refresh by rejoining the channel
      const channel = supabase.channel('active-users-presence');
      await channel.unsubscribe();
      
      setTimeout(() => {
        window.location.reload(); // Simple refresh for now
      }, 1000);
    } catch (error) {
      console.error('Error refreshing presence:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh active users',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-neon-purple" />
          <h2 className="text-xl font-semibold text-foreground">Active Users</h2>
          <Badge variant="outline" className="text-foreground">
            {activeUsers.length} online
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshPresence}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-purple" />
          <p className="text-muted-foreground">Loading active users...</p>
        </div>
      ) : activeUsers.length === 0 ? (
        <div className="text-center py-12">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">No active users</p>
          <p className="text-sm text-muted-foreground">Users will appear here when they're online</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {activeUsers.map((activeUser, index) => (
              <Card key={`${activeUser.user_id}-${index}`} className="p-4 bg-gaming-dark border-gaming-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-neon-purple/20 text-neon-purple">
                        {activeUser.username?.charAt(0)?.toUpperCase() || activeUser.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {activeUser.username || 'Anonymous User'}
                        </h3>
                        <Badge className={getRoleColor(activeUser.role || 'user')}>
                          {(activeUser.role || 'user').charAt(0).toUpperCase() + (activeUser.role || 'user').slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-3 w-3" />
                          <span className="truncate">{activeUser.page || '/'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>Active {getRelativeTime(activeUser.last_seen)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {activeUser.device_type === 'mobile' ? (
                            <Smartphone className="h-3 w-3" />
                          ) : (
                            <Monitor className="h-3 w-3" />
                          )}
                          <span>{activeUser.device_type || 'unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Online</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default ActiveUsersTracker;