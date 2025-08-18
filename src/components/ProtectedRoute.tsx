import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isBanned, setIsBanned] = useState(false);
  const [banLoading, setBanLoading] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!user) {
        setBanLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('banned')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking ban status:', error);
          setIsBanned(false);
        } else {
          setIsBanned(data?.banned || false);
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
        setIsBanned(false);
      } finally {
        setBanLoading(false);
      }
    };

    if (!loading) {
      checkBanStatus();
    }
  }, [user, loading]);

  if (loading || banLoading) {
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

  if (isBanned) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 bg-gaming-card border-gaming-border text-center max-w-md">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Account Banned</h2>
            <p className="text-muted-foreground">
              Your account has been banned and you cannot access this application. 
              Please contact support if you believe this is an error.
            </p>
            <div className="pt-4">
              <a 
                href="/auth" 
                className="text-neon-purple hover:text-neon-purple/80 underline"
              >
                Return to Login
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;