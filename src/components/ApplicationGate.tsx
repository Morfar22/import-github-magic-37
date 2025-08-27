import React from 'react';
import { useServerSettings } from '@/hooks/useServerSettings';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface ApplicationGateProps {
  children: React.ReactNode;
}

const ApplicationGate: React.FC<ApplicationGateProps> = ({ children }) => {
  const { settings, loading } = useServerSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
      </div>
    );
  }

  // Check if applications are disabled (treat undefined as open)
  if (settings.application_settings?.accept_applications === false) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center bg-gaming-card border-gaming-border">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Applications Currently Closed
              </h1>
              <p className="text-muted-foreground mb-6">
                We are not currently accepting new applications. Please check back later or join our Discord for updates.
              </p>
              <div className="text-sm text-muted-foreground">
                Applications will reopen when staff capacity allows for proper review.
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApplicationGate;