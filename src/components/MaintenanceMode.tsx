import { useServerSettings } from '@/hooks/useServerSettings';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MaintenanceMode = () => {
  const { settings } = useServerSettings();
  const { user } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);

  // Check if user is staff using the correct RPC function
  useEffect(() => {
    const checkStaffStatus = async () => {
      if (!user?.id) {
        setIsStaff(false);
        setCheckingStaff(false);
        return;
      }

      try {
        const { data } = await supabase.rpc('is_staff', { check_user_uuid: user.id });
        setIsStaff(!!data);
      } catch (error) {
        console.error('Error checking staff status:', error);
        setIsStaff(false);
      } finally {
        setCheckingStaff(false);
      }
    };

    checkStaffStatus();
  }, [user?.id]);

  if (!settings.general_settings?.maintenance_mode) {
    return null;
  }

  // Show loading state while checking staff status
  if (checkingStaff) {
    return null;
  }

  // If maintenance mode is on and user is not staff, show maintenance page
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-gaming-card border-gaming-border">
          <Settings className="h-16 w-16 text-neon-purple mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {settings.general_settings?.server_name || 'Server'} is Under Maintenance
          </h1>
          <p className="text-muted-foreground mb-6">
            {settings.general_settings?.welcome_message || 'We are currently performing maintenance to improve your experience. Please check back soon.'}
          </p>
          <div className="flex items-center justify-center text-neon-blue">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">Estimated completion: Soon</span>
          </div>
        </Card>
      </div>
    );
  }

  // Staff can see a maintenance banner but still access the site
  return (
    <div className="bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-500 p-3 text-center">
      <div className="flex items-center justify-center">
        <Settings className="h-4 w-4 mr-2" />
        <span className="font-medium">Maintenance Mode Active - Only staff can access the site</span>
      </div>
    </div>
  );
};

export default MaintenanceMode;