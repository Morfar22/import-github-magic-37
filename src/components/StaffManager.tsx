import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Shield, Trash2, Search, Crown, Users } from "lucide-react";

const StaffManager = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'moderator'])
        .order('role', { ascending: true });

      if (error) throw error;

      // Get user details separately
      const userIds = data?.map(role => role.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const staffWithProfiles = data?.map(role => ({
        ...role,
        profiles: profiles?.find(profile => profile.id === role.user_id)
      })) || [];

      setStaff(staffWithProfiles);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
  };

  const promoteUser = async (userId: string, role: 'admin' | 'moderator') => {
    try {
      // Check if user already has any role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (existingRole) {
        toast({
          title: "Error",
          description: "User already has this role",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role as 'admin' | 'moderator'
        });

      if (error) throw error;

      await fetchStaff();
      setIsAddingStaff(false);
      setSearchEmail("");
      setSelectedRole("");
      setAllUsers([]);
      toast({
        title: "Success",
        description: `User promoted to ${role} successfully`,
      });
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      });
    }
  };

  const changeUserRole = async (userId: string, currentRole: string, newRole: 'admin' | 'moderator') => {
    try {
      // Delete the old role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', currentRole as 'admin' | 'moderator');

      // Add the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as 'admin' | 'moderator'
        });

      if (error) throw error;

      await fetchStaff();
      toast({
        title: "Success",
        description: `User role changed to ${newRole}`,
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive",
      });
    }
  };

  const removeStaff = async (userId: string, role: 'admin' | 'moderator') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      await fetchStaff();
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Admin
        </Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Shield className="h-3 w-3 mr-1" />
          Moderator
        </Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading staff members...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Staff Management</h2>
        <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Staff Member</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Search for a user by email and assign them a staff role
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search by email..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
                <Button onClick={searchUsers}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label className="text-foreground">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gaming-card border-gaming-border">
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {allUsers.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <Label className="text-foreground">Search Results</Label>
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-gaming-dark rounded border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => promoteUser(user.id, selectedRole as 'admin' | 'moderator')}
                        disabled={!selectedRole}
                      >
                        Promote
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {staff.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No staff members found</p>
        ) : (
          staff.map((member) => (
            <Card key={`${member.user_id}-${member.role}`} className="p-4 bg-gaming-dark border-gaming-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">
                        {member.profiles?.username || 'Unknown User'}
                      </h3>
                      {getRoleBadge(member.role)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added: {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={member.role}
                    onValueChange={(newRole) => changeUserRole(member.user_id, member.role, newRole as 'admin' | 'moderator')}
                  >
                    <SelectTrigger className="w-32 bg-gaming-card border-gaming-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gaming-card border-gaming-border">
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gaming-card border-gaming-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Remove Staff Member</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to remove {member.profiles?.username} from the {member.role} role? 
                          They will lose their staff permissions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeStaff(member.user_id, member.role)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};

export default StaffManager;