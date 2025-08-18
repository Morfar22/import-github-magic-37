import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StaffProtectedRouteProps {
  children: ReactNode;
}

const StaffProtectedRoute = ({ children }: StaffProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setLoading(false);
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
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkStaffRole();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 bg-gaming-card border-gaming-border">
          <div className="flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-neon-purple" />
            <span className="text-foreground">Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default StaffProtectedRoute;