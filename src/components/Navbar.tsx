import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Server, LogIn, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CFXStatusIndicator from "@/components/CFXStatusIndicator";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [navbarConfig, setNavbarConfig] = useState({
    items: [
      { id: 'home', label: 'Home', path: '/', visible: true, order: 0, staffOnly: false },
      { id: 'apply', label: 'Apply', path: '/apply', visible: true, order: 1, staffOnly: false },
      { id: 'rules', label: 'Rules', path: '/rules', visible: true, order: 2, staffOnly: false },
      { id: 'team', label: 'Our Team', path: '/team', visible: true, order: 3, staffOnly: false },
      { id: 'staff', label: 'Staff Panel', path: '/staff', visible: true, order: 4, staffOnly: true },
      { id: 'servers', label: 'Servers', path: '/servers', visible: true, order: 5, staffOnly: true },
      { id: 'users', label: 'Users', path: '/users', visible: true, order: 6, staffOnly: true }
    ]
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setIsStaff(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_staff', { _user_id: user.id });

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

    loadNavbarConfig();

    // Set up real-time subscription for navbar config changes
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add a separate effect to force re-render when config changes
  useEffect(() => {
    console.log('Navbar config updated in component:', navbarConfig);
  }, [navbarConfig]);

  const NavLinks = () => {
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
            className="text-foreground hover:text-neon-purple transition-colors block py-2 md:py-0"
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </>
    );
  };

  const UserSection = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
      {user ? (
        <>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-neon-purple" />
            <span className="text-sm text-foreground">
              {user.user_metadata?.username || user.email}
            </span>
          </div>
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
      <nav className="border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Server className="h-8 w-8 text-neon-purple" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dreamlight RP
            </span>
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-gaming-card border-gaming-border">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="flex flex-col space-y-4">
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
    <nav className="border-b border-gaming-border bg-gaming-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Server className="h-8 w-8 text-neon-purple" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dreamlight RP
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
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