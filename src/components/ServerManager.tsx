import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Server, Plus, Edit, Trash2, Play, Pause, Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ServerDashboard from "./ServerDashboard";

interface ServerData {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ServerManager = () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServerDialog, setShowServerDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [serverForm, setServerForm] = useState({
    name: "",
    ip_address: "",
    port: 30120,
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from("servers")
        .select("*")
        .order("name");

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error("Error fetching servers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch servers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServer = async () => {
    try {
      if (editingServer) {
        const { error } = await supabase
          .from("servers")
          .update(serverForm)
          .eq("id", editingServer.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Server updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("servers")
          .insert(serverForm);

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Server created successfully",
        });
      }

      setShowServerDialog(false);
      setEditingServer(null);
      setServerForm({
        name: "",
        ip_address: "",
        port: 30120,
        is_active: true,
      });
      fetchServers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      const { error } = await supabase
        .from("servers")
        .delete()
        .eq("id", serverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
      fetchServers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (serverId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("servers")
        .update({ is_active: isActive })
        .eq("id", serverId);

      if (error) throw error;

      toast({
        title: "Success", 
        description: `Server ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchServers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRefreshAllStats = async () => {
    try {
      // Trigger stats refresh for all servers
      const { error: autoFetchError } = await supabase.functions.invoke("auto-fetch-server-stats");
      const { error: individualFetchError } = await supabase.functions.invoke("fetch-individual-server-stats");
      
      if (autoFetchError || individualFetchError) {
        console.error("Stats refresh errors:", { autoFetchError, individualFetchError });
      }

      toast({
        title: "Success",
        description: "Server stats refresh triggered",
      });
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast({
        title: "Error",
        description: "Failed to refresh server stats", 
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (server: ServerData) => {
    setEditingServer(server);
    setServerForm({
      name: server.name,
      ip_address: server.ip_address,
      port: server.port,
      is_active: server.is_active,
    });
    setShowServerDialog(true);
  };

  const openCreateDialog = () => {
    setEditingServer(null);
    setServerForm({
      name: "",
      ip_address: "",
      port: 30120,
      is_active: true,
    });
    setShowServerDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Server className="h-6 w-6 text-primary animate-spin" />
          <h1 className="text-2xl font-bold text-foreground">Loading servers...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Server Management</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefreshAllStats}
            variant="outline"
            size="sm"
            className="border-neon-teal/30 hover:border-neon-teal"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All Stats
          </Button>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Live Server Dashboard */}
      <ServerDashboard showTitle={false} />

      {/* Server Management List */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Server Configuration</h3>
        
        {servers.length === 0 ? (
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No servers configured yet.</p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Server
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className="flex items-center justify-between p-4 bg-gaming-darker/50 rounded-lg border border-gaming-border/50 hover:bg-gaming-darker transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {server.is_active ? (
                      <Play className="h-4 w-4 text-neon-green" />
                    ) : (
                      <Pause className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Badge variant={server.is_active ? "default" : "secondary"}>
                      {server.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground">{server.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {server.ip_address}:{server.port}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={server.is_active}
                    onCheckedChange={(checked) => handleToggleActive(server.id, checked)}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(server)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Server</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{server.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteServer(server.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Server Dialog */}
      <Dialog open={showServerDialog} onOpenChange={setShowServerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingServer ? "Edit Server" : "Add New Server"}
            </DialogTitle>
            <DialogDescription>
              Configure server connection details for monitoring and stats.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={serverForm.name}
                onChange={(e) => setServerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Main Server"
              />
            </div>

            <div>
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={serverForm.ip_address}
                onChange={(e) => setServerForm(prev => ({ ...prev, ip_address: e.target.value }))}
                placeholder="server.example.com"
              />
            </div>

            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={serverForm.port}
                onChange={(e) => setServerForm(prev => ({ ...prev, port: parseInt(e.target.value) || 30120 }))}
                placeholder="30120"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={serverForm.is_active}
                onCheckedChange={(checked) => setServerForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowServerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveServer}
              disabled={!serverForm.name || !serverForm.ip_address}
            >
              {editingServer ? "Update" : "Create"} Server
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServerManager;