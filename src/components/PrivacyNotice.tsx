import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Shield, Cookie, Database, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PrivacyNotice = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already accepted privacy notice
    const hasAccepted = localStorage.getItem('privacy-notice-accepted');
    if (!hasAccepted) {
      // Show notice after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy-notice-accepted', 'true');
    localStorage.setItem('privacy-notice-date', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    // For GDPR compliance, declining should limit functionality
    localStorage.setItem('privacy-notice-declined', 'true');
    localStorage.setItem('privacy-notice-date', new Date().toISOString());
    setIsVisible(false);
    // Optionally redirect to a page explaining limited functionality
    alert('Some features may be limited without accepting data collection. You can change this at any time in your privacy settings.');
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <Card className="bg-gaming-card border-gaming-border shadow-xl">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-neon-blue" />
                <h3 className="font-semibold text-foreground">Privacy & Data Collection</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We collect and store data to provide our roleplay server services. This includes:
              </p>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Cookie className="h-3 w-3 text-yellow-500" />
                  <span className="text-foreground">Authentication cookies & tokens</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Database className="h-3 w-3 text-blue-500" />
                  <span className="text-foreground">Email, username & profile data</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Lock className="h-3 w-3 text-green-500" />
                  <span className="text-foreground">Encrypted passwords & application data</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-neon-purple hover:text-neon-purple/80">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gaming-card border-gaming-border max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-foreground flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-neon-blue" />
                        <span>Privacy & Data Collection Details</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <section>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                          <Database className="h-4 w-4 text-blue-500" />
                          <span>What We Collect</span>
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                          <li>• <strong>Account Data:</strong> Email address, username, encrypted password</li>
                          <li>• <strong>Profile Information:</strong> Display name, avatar URL, user role (admin/staff/user)</li>
                          <li>• <strong>Application Data:</strong> Whitelist applications including RP experience, character backstory</li>
                          <li>• <strong>Gaming Data:</strong> Steam ID, Discord ID, FiveM name (when provided)</li>
                          <li>• <strong>System Data:</strong> Login timestamps, IP addresses (for security)</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                          <Cookie className="h-4 w-4 text-yellow-500" />
                          <span>Cookies & Local Storage</span>
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                          <li>• <strong>Authentication Tokens:</strong> Keep you logged in securely</li>
                          <li>• <strong>Session Data:</strong> Remember your preferences and settings</li>
                          <li>• <strong>Local Storage:</strong> Store UI preferences and temporary data</li>
                          <li>• <strong>Captcha Data:</strong> Prevent spam and abuse</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          <span>How We Protect Your Data</span>
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                          <li>• <strong>Encryption:</strong> All passwords are securely hashed and encrypted</li>
                          <li>• <strong>Secure Storage:</strong> Data stored in protected Supabase infrastructure</li>
                          <li>• <strong>Access Control:</strong> Role-based permissions limit data access</li>
                          <li>• <strong>Regular Backups:</strong> Secure, encrypted database backups</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="font-semibold text-foreground mb-2">Why We Collect This Data</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                          <li>• Provide secure authentication and account management</li>
                          <li>• Process whitelist applications for our FiveM server</li>
                          <li>• Maintain server security and prevent abuse</li>
                          <li>• Improve user experience and server functionality</li>
                          <li>• Comply with gaming platform requirements</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="font-semibold text-foreground mb-2">Your Rights (GDPR)</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                          <li>• <strong>Access:</strong> Request a copy of your personal data</li>
                          <li>• <strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                          <li>• <strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                          <li>• <strong>Portability:</strong> Receive your data in a machine-readable format</li>
                          <li>• <strong>Objection:</strong> Object to processing of your personal data</li>
                        </ul>
                      </section>

                      <div className="bg-neon-purple/10 border border-neon-purple/20 rounded-lg p-3">
                        <p className="text-sm text-foreground">
                          <strong>Contact:</strong> For privacy requests or questions, contact our staff team through Discord or email: support@dreamlightrp.dk. 
                          Data is retained for account functionality and may be deleted upon account closure.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDecline}
                    className="border-gaming-border hover:bg-gaming-dark"
                  >
                    Decline
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleAccept}
                    className="bg-neon-purple hover:bg-neon-purple/80"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PrivacyNotice;