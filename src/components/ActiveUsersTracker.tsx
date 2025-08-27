import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Globe, Clock, RefreshCw, Eye, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalPresenceContext } from '@/contexts/GlobalPresenceContext';

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
  const { activeUsers } = useGlobalPresenceContext();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();


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
      window.location.reload(); // Simple refresh for now
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