import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailTest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { testEmail: email }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Test email sent successfully. Check your inbox!",
      });
    } catch (error: any) {
      console.error('Email test error:', error);
      toast({
        title: "Email Test Failed",
        description: error.message || "Failed to send test email. Make sure your Resend API key is configured.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Test Email System</h3>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter test email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={testEmail} disabled={loading}>
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        This will test if your Resend API key is working correctly.
      </p>
    </div>
  );
};

export default EmailTest;