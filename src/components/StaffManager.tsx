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
import { UserPlus, Shield, Trash2, Search, Crown, Users, Star, AlertTriangle, HelpCircle } from "lucide-react";

interface StaffManagerProps {
  onRefresh?: () => void;
}

const StaffManager = ({ onRefresh }: StaffManagerProps) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffRoles();
    fetchStaff();
  }, []);

  const fetchStaffRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: false });

      if (error) throw error;
      setStaffRoles(data || []);
    } catch (error) {
      console.error('Error fetching staff roles:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from new role assignments system
      const { data: roleAssignments, error: assignmentError } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          staff_roles!inner (
            id,
            name,
            display_name,
            color,
            hierarchy_level
          )
        `)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;

      // Fetch from old user_roles system (admin/moderator)
      const { data: oldRoles, error: oldRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'moderator']);

      if (oldRolesError) throw oldRolesError;

      // Get all user IDs
      const assignmentUserIds = roleAssignments?.map(assignment => assignment.user_id) || [];
      const oldRoleUserIds = oldRoles?.map(role => role.user_id) || [];
      const allUserIds = [...new Set([...assignmentUserIds, ...oldRoleUserIds])];

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, full_name')
        .in('id', allUserIds);

      if (profilesError) throw profilesError;

      // Combine new role assignments with profiles
      const newStaff = roleAssignments?.map(assignment => ({
        ...assignment,
        profiles: profiles?.find(profile => profile.id === assignment.user_id),
        isLegacy: false
      })) || [];

      // Convert old roles to new format
      const legacyStaff = oldRoles?.map(role => ({
        id: role.id,
        user_id: role.user_id,
        role_id: null,
        assigned_at: role.created_at,
        assigned_by: null,
        expires_at: null,
        is_active: true,
        staff_roles: {
          id: null,
          name: role.role,
          display_name: role.role === 'admin' ? 'Administrator (Legacy)' : 'Moderator (Legacy)',
          color: role.role === 'admin' ? '#7c3aed' : '#2563eb',
          hierarchy_level: role.role === 'admin' ? 80 : 60
        },
        profiles: profiles?.find(profile => profile.id === role.user_id),
        isLegacy: true
      })) || [];

      // Combine and sort by hierarchy level
      const allStaff = [...newStaff, ...legacyStaff];
      allStaff.sort((a, b) => (b.staff_roles?.hierarchy_level || 0) - (a.staff_roles?.hierarchy_level || 0));

      setStaff(allStaff);
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

  const promoteUser = async (userId: string, roleId: string) => {
    try {
      // Check if user already has this role
      const { data: existingAssignment } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .single();

      if (existingAssignment) {
        toast({
          title: "Error",
          description: "User already has this role",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      const selectedStaffRole = staffRoles.find(r => r.id === roleId);
      await fetchStaff();
      onRefresh?.(); // Refresh parent data
      setIsAddingStaff(false);
      setSearchEmail("");
      setSelectedRole("");
      setAllUsers([]);
      toast({
        title: "Success",
        description: `User promoted to ${selectedStaffRole?.display_name} successfully`,
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

  const changeUserRole = async (member: any, newRoleId: string) => {
    try {
      if (member.isLegacy) {
        // For legacy roles, we need to delete from user_roles and create in user_role_assignments
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', member.id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('user_role_assignments')
          .insert({
            user_id: member.user_id,
            role_id: newRoleId,
            assigned_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (insertError) throw insertError;
      } else {
        // For new system roles, just update
        const { error } = await supabase
          .from('user_role_assignments')
          .update({
            role_id: newRoleId,
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
            assigned_at: new Date().toISOString()
          })
          .eq('id', member.id);

        if (error) throw error;
      }

      const newStaffRole = staffRoles.find(r => r.id === newRoleId);
      await fetchStaff();
      onRefresh?.(); // Refresh parent data
      toast({
        title: "Success",
        description: `User role changed to ${newStaffRole?.display_name}`,
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

  const removeStaff = async (member: any) => {
    try {
      if (member.isLegacy) {
        // For legacy roles, delete from user_roles table
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', member.id);

        if (error) throw error;
      } else {
        // For new system roles, set is_active to false
        const { error } = await supabase
          .from('user_role_assignments')
          .update({ is_active: false })
          .eq('id', member.id);

        if (error) throw error;
      }

      await fetchStaff();
      onRefresh?.(); // Refresh parent data
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

  const getRoleBadge = (staffRole: any) => {
    const getRoleIcon = (roleName: string) => {
      switch (roleName) {
        case 'super_admin':
          return <Crown className="h-3 w-3 mr-1" />;
        case 'admin':
          return <Shield className="h-3 w-3 mr-1" />;
        case 'moderator':
          return <Users className="h-3 w-3 mr-1" />;
        case 'helper':
          return <HelpCircle className="h-3 w-3 mr-1" />;
        case 'trainee':
          return <Star className="h-3 w-3 mr-1" />;
        default:
          return <AlertTriangle className="h-3 w-3 mr-1" />;
      }
    };

    return (
      <Badge 
        className="border" 
        style={{
          backgroundColor: `${staffRole.color}20`,
          borderColor: `${staffRole.color}50`,
          color: staffRole.color
        }}
      >
        {getRoleIcon(staffRole.name)}
        {staffRole.display_name}
      </Badge>
    );
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
                    {staffRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: role.color }}
                          />
                          <span>{role.display_name}</span>
                        </div>
                      </SelectItem>
                    ))}
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
                        onClick={() => promoteUser(user.id, selectedRole)}
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
            <Card key={member.id} className="p-4 bg-gaming-dark border-gaming-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">
                        {member.profiles?.username || 'Unknown User'}
                      </h3>
                      {getRoleBadge(member.staff_roles)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned: {new Date(member.assigned_at).toLocaleDateString()}
                    </p>
                    {member.expires_at && (
                      <p className="text-xs text-yellow-400">
                        Expires: {new Date(member.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {member.isLegacy ? (
                    <Select
                      value=""
                      onValueChange={(newRoleId) => changeUserRole(member, newRoleId)}
                    >
                      <SelectTrigger className="w-40 bg-gaming-card border-gaming-border text-foreground">
                        <SelectValue placeholder="Upgrade to new role" />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-card border-gaming-border">
                        {staffRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.display_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={member.role_id}
                      onValueChange={(newRoleId) => changeUserRole(member, newRoleId)}
                    >
                      <SelectTrigger className="w-40 bg-gaming-card border-gaming-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-card border-gaming-border">
                        {staffRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.display_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

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
                          Are you sure you want to remove {member.profiles?.username} from the {member.staff_roles?.display_name} role? 
                          They will lose their staff permissions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeStaff(member)}
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