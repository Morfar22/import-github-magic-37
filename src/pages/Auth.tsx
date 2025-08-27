import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Server, Mail, Lock, User, AlertCircle, Shield, Ban } from "lucide-react";
import DiscordIcon from "@/components/icons/DiscordIcon";

import HCaptcha from '@hcaptcha/react-hcaptcha';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showBannedScreen, setShowBannedScreen] = useState(false);
  const [bannedUserInfo, setBannedUserInfo] = useState<{username: string, email: string} | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [serverName, setServerName] = useState("Adventure rp");
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for password reset flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsPasswordReset(true);
      return; // Don't redirect if it's a password reset
    }

    // Check if user is already logged in - but not if we're showing banned screen
    if (!showBannedScreen) {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/");
        }
      };
      checkUser();
    }
  }, [navigate, showBannedScreen]);

  useEffect(() => {
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

    loadServerName();
  }, []);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!captchaToken) {
      setError("Please complete the captcha verification");
      setIsLoading(false);
      return;
    }

    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken
        }
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before signing in.");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        // Check if user is banned BEFORE allowing login
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('banned, username')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking user profile:', profileError);
          setError("Error checking account status. Please try again.");
          // Sign out the user immediately
          await supabase.auth.signOut({ scope: 'global' });
          return;
        }

        if (profile?.banned) {
          // User is banned - show banned screen
          console.log('🚨 User is banned, showing banned screen');
          setBannedUserInfo({
            username: profile.username || 'User',
            email: data.user.email || email
          });
          setShowBannedScreen(true);
          // Don't sign out here - let the banned screen handle it
          return;
        }

        // User is not banned - allow login
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        window.location.href = '/';
      }
      
      // Reset captcha
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      // Reset captcha on error
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please make sure both password fields are identical.");
      setIsLoading(false);
      return;
    }

    if (!captchaToken) {
      setError("Please complete the captcha verification");
      setIsLoading(false);
      return;
    }

    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          captchaToken,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (error.message.includes("Password should be at least")) {
          setError("Password must be at least 6 characters long.");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email for a confirmation link.",
        });
        // Welcome email now handled by Supabase SMTP configuration; no custom function call needed.
      }
      
      // Reset captcha
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      // Reset captcha on error
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated!",
      });

      // Redirect to home page
      navigate("/");
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // Loading will be handled by the OAuth redirect
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      setIsLoading(false);
    }
};

  const handleResendConfirmation = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) {
        setError(error.message);
        return;
      }
      toast({ title: 'Confirmation email sent', description: 'Check your inbox (and spam folder).' });
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email');
    } finally {
      setIsLoading(false);
    }
  };

  
  // Show banned screen if user is banned
  if (showBannedScreen && bannedUserInfo) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-4">
              <Server className="h-8 w-8 text-neon-purple" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {serverName}
              </span>
            </Link>
          </div>

          <Card className="bg-gaming-card border-red-500/50 shadow-gaming">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <Ban className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-red-500 text-xl">Account Suspended</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your access to {serverName} has been restricted
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-400">
                      Account Status: Suspended
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Username:</strong> {bannedUserInfo.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Email:</strong> {bannedUserInfo.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Your account has been suspended by our moderation team and you cannot access the application at this time.
                </p>
                <p>
                  If you believe this is an error or would like to appeal this decision, please contact our support team.
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <Button 
                  onClick={async () => {
                    // Sign out and clean up when user wants to try different account
                    await supabase.auth.signOut({ scope: 'global' });
                    cleanupAuthState();
                    setShowBannedScreen(false);
                    setBannedUserInfo(null);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  variant="outline" 
                  className="w-full border-gaming-border hover:bg-gaming-dark"
                >
                  Try Different Account
                </Button>
                
                <Button 
                  onClick={() => navigate("/")}
                  variant="secondary" 
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show password reset form if user came from reset link
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-4">
              <Server className="h-8 w-8 text-neon-purple" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {serverName}
              </span>
            </Link>
            <p className="text-muted-foreground">
              Create a new password for your account
            </p>
          </div>

          <Card className="bg-gaming-card border-gaming-border shadow-gaming">
            <CardHeader>
              <CardTitle className="text-center text-foreground">Reset Password</CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password (min. 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Updating Password..." : "Update Password"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsPasswordReset(false);
                      navigate("/auth");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <Server className="h-8 w-8 text-neon-purple" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {serverName}
            </span>
          </Link>
          <p className="text-muted-foreground">
            Sign in to access your account and manage your applications
          </p>
        </div>

        <Card className="bg-gaming-card border-gaming-border shadow-gaming">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-gaming-dark">
                <TabsTrigger value="signin" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {error && error.toLowerCase().includes('confirm') && (
                <div className="mb-4">
                  <Button onClick={handleResendConfirmation} variant="secondary" className="w-full">
                    Resend confirmation email
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">From noreply@adventurerp.dk — check spam/junk.</p>
                </div>
              )}

              <TabsContent value="signin" className="space-y-4">
                <CardTitle className="text-center text-foreground">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                  Sign in to your {serverName} account
                </CardDescription>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey="daba5502-dfbc-40c8-9b56-0bc676d83b98"
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      theme="dark"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isLoading || !captchaToken}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gaming-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gaming-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscordSignIn}
                  disabled={isLoading}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] hover:border-[#4752C4]"
                >
                  <DiscordIcon className="mr-2 h-4 w-4" />
                  Sign in with Discord
                </Button>

              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <CardTitle className="text-center text-foreground">Join {serverName}</CardTitle>
                <CardDescription className="text-center">
                  Create your account to apply for whitelist
                </CardDescription>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-foreground">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min. 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                        minLength={6}
                      />
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-400">Passwords do not match</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey="daba5502-dfbc-40c8-9b56-0bc676d83b98"
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      theme="dark"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="neon" 
                    className="w-full" 
                    disabled={isLoading || !captchaToken}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gaming-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gaming-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscordSignIn}
                  disabled={isLoading}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] hover:border-[#4752C4]"
                >
                  <DiscordIcon className="mr-2 h-4 w-4" />
                  Sign up with Discord
                </Button>

              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-neon-purple transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;