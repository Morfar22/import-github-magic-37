import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export const useGlobalPresence = () => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [userPresence, setUserPresence] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Join the global presence channel
    const channel = supabase.channel('global-presence');

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
        
        console.log('Global presence sync:', presenceState);
        
        Object.keys(presenceState).forEach(presenceKey => {
          const presences = presenceState[presenceKey];
          
          if (presences && Array.isArray(presences)) {
            // Get the most recent presence entry for this user
            const sortedPresences = presences
              .filter((presence: any) => {
                return presence && 
                  typeof presence === 'object' && 
                  presence.user_id &&
                  presence.joined_at &&
                  presence.last_seen;
              })
              .sort((a: any, b: any) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
            
            if (sortedPresences.length > 0) {
              const latestPresence = sortedPresences[0] as unknown as ActiveUser;
              users.push(latestPresence);
            }
          }
        });
        
        console.log('Global active users:', users);
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Global user joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Global user left:', leftPresences);
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

  return { activeUsers };
};