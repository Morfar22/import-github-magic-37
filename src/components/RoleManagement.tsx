import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  UserPlus,
  X,
  Check,
  ChevronDown
} from "lucide-react";

interface StaffRole {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  permissions?: string[];
}

interface Permission {
  name: string;
  display_name: string;
  description: string;
  category: string;
}

interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  profiles: {
    username: string;
    email: string;
  };
  staff_roles: {
    display_name: string;
    color: string;
  };
}

export function RoleManagement() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchUserAssignments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('staff_roles')
      .select('*')
      .order('hierarchy_level', { ascending: false });

    if (error) throw error;
    setRoles(data || []);
  };

  const fetchPermissions = async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category, display_name');

    if (error) throw error;
    setPermissions(data || []);
  };

  const fetchUserAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Fetch profile and role data separately to avoid join issues
      const enrichedData = await Promise.all(
        (data || []).map(async (assignment) => {
          const [profileResult, roleResult] = await Promise.all([
            supabase.from('profiles').select('username, email').eq('id', assignment.user_id).single(),
            supabase.from('staff_roles').select('display_name, color').eq('id', assignment.role_id).single()
          ]);

          return {
            ...assignment,
            profiles: profileResult.data || { username: '', email: '' },
            staff_roles: roleResult.data || { display_name: '', color: '' }
          };
        })
      );

      setUserAssignments(enrichedData);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_name')
      .eq('role_id', roleId);

    if (error) throw error;
    return data?.map(p => p.permission_name) || [];
  };

  const handleSelectRole = async (role: StaffRole) => {
    setSelectedRole(role);
    const perms = await fetchRolePermissions(role.id);
    setRolePermissions(perms);
  };

  const saveRole = async (roleData: Partial<StaffRole>) => {
    try {
      if (roleData.id) {
        const { error } = await supabase
          .from('staff_roles')
          .update(roleData)
          .eq('id', roleData.id);
        if (error) throw error;
      } else {
        // Ensure required fields are present for insert
        const insertData = {
          name: roleData.name!,
          display_name: roleData.display_name!,
          description: roleData.description,
          color: roleData.color || '#6366f1',
          hierarchy_level: roleData.hierarchy_level || 1,
          is_active: roleData.is_active ?? true
        };
        const { error } = await supabase
          .from('staff_roles')
          .insert(insertData);
        if (error) throw error;
      }
      
      await fetchRoles();
      setShowRoleDialog(false);
      toast({
        title: "Success",
        description: `Role ${roleData.id ? 'updated' : 'created'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('staff_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      await fetchRoles();
      setSelectedRole(null);
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      // Remove all existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole.id);

      // Add new permissions
      if (rolePermissions.length > 0) {
        const permissionRecords = rolePermissions.map(permName => ({
          role_id: selectedRole.id,
          permission_name: permName
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionRecords);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email')
      .ilike('email', `%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data || []);
  };

  const assignRole = async (userId: string, roleId: string, expiresAt?: string) => {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role_id: roleId,
          expires_at: expiresAt || null
        });

      if (error) throw error;

      await fetchUserAssignments();
      setShowAssignDialog(false);
      setUserSearchQuery("");
      setSearchResults([]);
      
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeRoleAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      await fetchUserAssignments();
      
      toast({
        title: "Success",
        description: "Role assignment removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Role & Permissions Management</h1>
        </div>
        <Button onClick={() => setShowRoleDialog(true)} className="bg-primary hover:bg-primary/80">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="assignments">User Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles List */}
            <Card className="p-6 bg-gaming-card border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Available Roles</h3>
              <div className="space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedRole?.id === role.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gaming-border bg-gaming-darker/50 hover:bg-gaming-darker'
                    }`}
                    onClick={() => handleSelectRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <div>
                          <h4 className="font-medium text-foreground">{role.display_name}</h4>
                          <p className="text-sm text-muted-foreground">Level {role.hierarchy_level}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRole(role);
                            setShowRoleDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground mt-2">{role.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Role Permissions */}
            {selectedRole && (
              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Permissions for {selectedRole.display_name}
                  </h3>
                  <Button onClick={updateRolePermissions} size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-foreground capitalize">{category}</h4>
                      {perms.map((perm) => (
                        <div key={perm.name} className="flex items-center space-x-2">
                          <Switch
                            checked={rolePermissions.includes(perm.name)}
                            onCheckedChange={(checked) => {
                              setRolePermissions(prev =>
                                checked
                                  ? [...prev, perm.name]
                                  : prev.filter(p => p !== perm.name)
                              );
                            }}
                          />
                          <div>
                            <Label className="text-sm font-medium">{perm.display_name}</Label>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="p-6 bg-gaming-card border-gaming-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">System Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-primary capitalize">{category}</h4>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <div key={perm.name} className="p-3 rounded-lg bg-gaming-darker/50">
                        <h5 className="font-medium text-sm text-foreground">{perm.display_name}</h5>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Current Role Assignments</h3>
            <Button onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </div>

          <Card className="p-6 bg-gaming-card border-gaming-border">
            <div className="space-y-4">
              {userAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gaming-darker/50 border border-gaming-border"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: assignment.staff_roles.color }}
                    />
                    <div>
                      <h4 className="font-medium text-foreground">{assignment.profiles.username}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.profiles.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge style={{ backgroundColor: assignment.staff_roles.color, color: 'white' }}>
                      {assignment.staff_roles.display_name}
                    </Badge>
                    {assignment.expires_at && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(assignment.expires_at).toLocaleDateString()}
                      </p>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gaming-card border-gaming-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Role Assignment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove the {assignment.staff_roles.display_name} role from {assignment.profiles.username}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeRoleAssignment(assignment.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Role Dialog */}
      <RoleDialog
        role={selectedRole}
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        onSave={saveRole}
        onDelete={selectedRole ? () => deleteRole(selectedRole.id) : undefined}
      />

      {/* Assign Role Dialog */}
      <AssignRoleDialog
        roles={roles}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssign={assignRole}
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        searchResults={searchResults}
        onSearchUsers={searchUsers}
      />
    </div>
  );
}

// Role Dialog Component
interface RoleDialogProps {
  role: StaffRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (role: Partial<StaffRole>) => void;
  onDelete?: () => void;
}

function RoleDialog({ role, open, onOpenChange, onSave, onDelete }: RoleDialogProps) {
  const [formData, setFormData] = useState<Partial<StaffRole>>({
    name: '',
    display_name: '',
    description: '',
    color: '#6366f1',
    hierarchy_level: 1,
    is_active: true
  });

  useEffect(() => {
    if (role) {
      setFormData(role);
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        color: '#6366f1',
        hierarchy_level: 1,
        is_active: true
      });
    }
  }, [role, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gaming-card border-gaming-border max-w-md">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {role ? 'Update the role details below.' : 'Create a new staff role with custom permissions.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Role Name (Internal)</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., senior_moderator"
              className="bg-gaming-dark border-gaming-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., Senior Moderator"
              className="bg-gaming-dark border-gaming-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Role responsibilities and scope..."
              className="bg-gaming-dark border-gaming-border"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="bg-gaming-dark border-gaming-border h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Hierarchy Level</Label>
              <Input
                type="number"
                value={formData.hierarchy_level}
                onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="bg-gaming-dark border-gaming-border"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Role is active</Label>
          </div>
          
          <div className="flex justify-between pt-4">
            <div>
              {role && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Role
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gaming-card border-gaming-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this role? This will remove all user assignments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{role ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Assign Role Dialog Component
interface AssignRoleDialogProps {
  roles: StaffRole[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (userId: string, roleId: string, expiresAt?: string) => void;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  searchResults: any[];
  onSearchUsers: (query: string) => void;
}

function AssignRoleDialog({ 
  roles, 
  open, 
  onOpenChange, 
  onAssign,
  userSearchQuery,
  setUserSearchQuery,
  searchResults,
  onSearchUsers
}: AssignRoleDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    onSearchUsers(userSearchQuery);
  }, [userSearchQuery]);

  const handleAssign = () => {
    if (selectedUserId && selectedRoleId) {
      onAssign(selectedUserId, selectedRoleId, expiresAt || undefined);
      setSelectedUserId("");
      setSelectedRoleId("");
      setExpiresAt("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gaming-card border-gaming-border">
        <DialogHeader>
          <DialogTitle>Assign Role to User</DialogTitle>
          <DialogDescription>
            Search for a user and assign them a role.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search User by Email</Label>
            <Input
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Enter email to search..."
              className="bg-gaming-dark border-gaming-border"
            />
            
            {searchResults.length > 0 && (
              <div className="border border-gaming-border rounded-lg bg-gaming-dark max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer hover:bg-gaming-darker/80 ${
                      selectedUserId === user.id ? 'bg-primary/20' : ''
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Select Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="bg-gaming-dark border-gaming-border">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.filter(role => role.is_active).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span>{role.display_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="bg-gaming-dark border-gaming-border"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedUserId || !selectedRoleId}
            >
              Assign Role
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RoleManagement;