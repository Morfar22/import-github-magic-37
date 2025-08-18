import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, Clock, RotateCcw } from "lucide-react";

interface ClosedApplication {
  id: string;
  steam_name: string;
  discord_tag: string;
  status: string;
  created_at: string;
  closed_at: string;
  closed_by: string;
}

const ClosedApplications = () => {
  const [closedApplications, setClosedApplications] = useState<ClosedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchClosedApplications();
    }
  }, [user]);

  const fetchClosedApplications = async () => {
    try {
      console.log('Fetching closed applications...');
      console.log('Current user:', user);
      setError('');
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('closed', true)
        .order('closed_at', { ascending: false });

      console.log('Closed applications query result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        setError(`Database error: ${error.message}`);
        toast({
          title: "Error",
          description: `Failed to fetch closed applications: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Found closed applications:', data?.length || 0);
      setClosedApplications(data || []);
      
      if (!data || data.length === 0) {
        console.log('No closed applications found - this might be a permissions issue');
      }
    } catch (error: any) {
      console.error('Error fetching closed applications:', error);
      setError(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to fetch closed applications: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReopenApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          closed: false,
          closed_at: null,
          closed_by: null
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application reopened and restored to active list",
      });

      fetchClosedApplications();
      
    } catch (error) {
      console.error('Error reopening application:', error);
      toast({
        title: "Error",
        description: "Failed to reopen application",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gaming-dark rounded" />
                <div className="h-4 w-48 bg-gaming-dark rounded" />
              </div>
              <div className="h-8 w-20 bg-gaming-dark rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (closedApplications.length === 0) {
    return (
      <Card className="p-8 text-center bg-gaming-card border-gaming-border shadow-gaming">
        <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Closed Applications</h3>
        <p className="text-muted-foreground">No applications have been closed yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Closed Applications ({closedApplications.length})</h2>
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          Hidden from main view
        </Badge>
      </div>

      {closedApplications.map((application) => (
        <Card key={application.id} className="p-6 bg-gaming-card border-gaming-border shadow-gaming opacity-75">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{application.steam_name}</h3>
                <Badge 
                  variant="outline" 
                  className={
                    application.status === 'approved' 
                      ? "border-green-500 text-green-500" 
                      : application.status === 'denied'
                      ? "border-red-500 text-red-500"
                      : application.status === 'under_review'
                      ? "border-blue-500 text-blue-500"
                      : "border-yellow-500 text-yellow-500"
                  }
                >
                  {application.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {application.status === 'denied' && <XCircle className="h-3 w-3 mr-1" />}
                  {application.status === 'under_review' && <Eye className="h-3 w-3 mr-1" />}
                  {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="border-orange-500 text-orange-500">
                  CLOSED
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Submitted {new Date(application.created_at).toLocaleDateString()} • 
                Closed {new Date(application.closed_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReopenApplication(application.id)}
                className="border-green-500 text-green-500 hover:bg-green-500/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reopen
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Discord:</span>
              <p className="text-foreground">{application.discord_tag}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ClosedApplications;