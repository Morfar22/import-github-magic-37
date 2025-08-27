import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Server, LogIn, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CFXStatusIndicator from "@/components/CFXStatusIndicator";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [serverName, setServerName] = useState("adventure rp");
  const [navbarConfig, setNavbarConfig] = useState({
    items: [
      { id: 'home', label: 'Home', path: '/', visible: true, order: 0, staffOnly: false },
      { id: 'apply', label: 'Apply', path: '/apply', visible: true, order: 1, staffOnly: false },
      { id: 'rules', label: 'Rules', path: '/rules', visible: true, order: 2, staffOnly: false },
      { id: 'laws', label: 'Laws', path: '/laws', visible: true, order: 3, staffOnly: false },
      { id: 'packages', label: 'Packages', path: '/packages', visible: true, order: 4, staffOnly: false },
      { id: 'team', label: 'Our Team', path: '/team', visible: true, order: 5, staffOnly: false },
      { id: 'partners', label: 'Partners', path: '/partners', visible: true, order: 6, staffOnly: false },
      { id: 'live', label: 'Live', path: '/live', visible: true, order: 7, staffOnly: false },
      { id: 'staff', label: 'Staff Panel', path: '/staff', visible: true, order: 8, staffOnly: true },
      { id: 'servers', label: 'Servers', path: '/servers', visible: true, order: 8, staffOnly: true },
      { id: 'users', label: 'Users', path: '/users', visible: true, order: 9, staffOnly: true }
    ]
  });
  const isMobile = useIsMobile();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    // Set up real-time subscription for profile changes
    if (user) {
      const channel = supabase
        .channel('user-profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('User profile updated:', payload);
            if (payload.new) {
              setUserProfile(payload.new);
            } else if (payload.eventType === 'DELETE') {
              setUserProfile(null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setIsStaff(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_staff', { check_user_uuid: user.id });

        if (error) {
          console.error('Error checking staff role:', error);
          setIsStaff(false);
        } else {
          setIsStaff(data);
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setIsStaff(false);
      }
    };

    checkStaffRole();
  }, [user]);

  useEffect(() => {
    const loadNavbarConfig = async () => {
      try {
        const { data } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'navbar_config')
          .maybeSingle();
          
        if (data?.setting_value) {
          console.log('Loading navbar config from database:', data.setting_value);
          setNavbarConfig(data.setting_value as typeof navbarConfig);
        } else {
          console.log('No navbar config found in database, using default');
        }
        setConfigLoaded(true);
      } catch (error) {
        console.error('Error loading navbar config:', error);
        setConfigLoaded(true);
      }
    };

    const loadServerName = async () => {
      try {
        const { data } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'general_settings')
          .maybeSingle();

        if (data?.setting_value && typeof data.setting_value === 'object' && 
            data.setting_value !== null && 'server_name' in data.setting_value) {
          setServerName((data.setting_value as any).server_name);
        }
      } catch (error) {
        console.error('Error loading server name:', error);
      }
    };

    Promise.all([loadNavbarConfig(), loadServerName()]);

    // Set up real-time subscription for navbar config changes
    const navChannel = supabase
      .channel('navbar-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_settings',
          filter: 'setting_key=eq.navbar_config'
        },
        (payload) => {
          console.log('Navbar config updated:', payload);
          if (payload.new && (payload.new as any).setting_value) {
            setNavbarConfig((payload.new as any).setting_value as typeof navbarConfig);
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for server name changes
    const serverChannel = supabase
      .channel('server-name-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_settings',
          filter: 'setting_key=eq.general_settings'
        },
        (payload) => {
          console.log('Server settings updated:', payload);
          if (payload.new && (payload.new as any).setting_value && 
              typeof (payload.new as any).setting_value === 'object' && 
              'server_name' in (payload.new as any).setting_value) {
            setServerName((payload.new as any).setting_value.server_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(navChannel);
      supabase.removeChannel(serverChannel);
    };
  }, []);

  // Add a separate effect to force re-render when config changes
  useEffect(() => {
    console.log('Navbar config updated in component:', navbarConfig);
  }, [navbarConfig]);

  const NavLinks = () => {
    const location = useLocation();
    
    // Don't render until config is loaded
    if (!configLoaded) {
      return null;
    }

    // Filter and sort navigation items based on configuration
    const visibleItems = navbarConfig.items
      .filter(item => {
        console.log(`Item ${item.id}: visible=${item.visible}, staffOnly=${item.staffOnly}, isStaff=${isStaff}`);
        return item.visible && (!item.staffOnly || isStaff);
      })
      .sort((a, b) => a.order - b.order);

    console.log('Visible navigation items:', visibleItems.map(item => item.id));

    return (
      <>
        {visibleItems.map((item) => (
          <Link 
            key={item.id}
            to={item.path} 
            className={`
              relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group
              block md:inline-block
              ${location.pathname === item.path 
                ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-gaming-darker/80 hover:scale-105"
              }
            `}
            onClick={() => setIsOpen(false)}
          >
            <span className="relative z-10">{item.label}</span>
            {location.pathname === item.path && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur-sm -z-10" />
            )}
          </Link>
        ))}
      </>
    );
  };

  const UserSection = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
      {user ? (
        <>
          <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={userProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture} 
                alt={userProfile?.username || user.email || 'User'} 
              />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xs">
                {(userProfile?.username || user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">
              {userProfile?.username || user.user_metadata?.full_name || user.email}
            </span>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="hover:border-neon-purple/50 w-full md:w-auto"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </>
      ) : (
        <Button 
          variant="neon" 
          size="sm" 
          asChild 
          className="w-full md:w-auto"
        >
          <Link to="/auth" onClick={() => setIsOpen(false)}>
            <LogIn className="h-4 w-4 mr-1" />
            Sign In
          </Link>
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <nav className="border-b border-gaming-border bg-gaming-card/95 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:scale-110">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div className="animate-fade-in">
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {serverName}
              </span>
              <p className="text-xs text-muted-foreground -mt-1">Gaming Server</p>
            </div>
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden hover:bg-gaming-darker/80 hover:scale-110 transition-all duration-300 rounded-lg"
              >
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] bg-gaming-card border-gaming-border">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="border-b border-gaming-border pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary">
                      <Server className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{serverName}</h2>
                      <p className="text-xs text-muted-foreground">Navigation Menu</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <NavLinks />
                </div>
                
                <div className="border-t border-gaming-border pt-6">
                  <CFXStatusIndicator />
                </div>
                
                <div className="border-t border-gaming-border pt-6">
                  <UserSection />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gaming-border bg-gaming-card/95 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:scale-110">
            <Server className="h-6 w-6 text-white" />
          </div>
          <div className="animate-fade-in">
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {serverName}
            </span>
            <p className="text-xs text-muted-foreground -mt-1">Gaming Server</p>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-1">
          <NavLinks />
        </div>
        
        <div className="flex items-center space-x-4">
          <CFXStatusIndicator />
          <UserSection />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;