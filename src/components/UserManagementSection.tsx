import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Ban, Shield, Trash2, Eye, Mail, Calendar, Clock, UserX, CheckCircle, AlertTriangle, Edit2, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ActiveUsersTracker from "./ActiveUsersTracker";

const UserManagementSection = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user roles separately
      const userIds = data?.map(profile => profile.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles = data?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(role => role.user_id === profile.id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleBanUser = async (user: any, reason: string) => {
  if (!user || !user.email) {
    toast({
      title: "Error",
      description: "Could not send ban notification: user or user email missing.",
      variant: "destructive",
    });
    console.error("handleBanUser called with:", user, reason);
    return;
  }

  try {
    // Always get staff info for both DB and notification
    const staff = await supabase.auth.getUser();
    const staffId = staff.data.user?.id; // UUID for banned_by DB column
    const staffDisplayName =
      staff.data.user?.email ||
      "Unknown Staff";

    // Mark user as banned in your profiles table (use UUID!)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        banned: true, 
        banned_at: new Date().toISOString(),
        banned_by: staffId // <-- UUID, never display name/email
      })
      .eq('id', user.id);

    if (error) throw error;

    // Send ban notification via edge function – use name/email for email template
    try {
      await supabase.functions.invoke('send-ban-notification', {
        body: {
          userEmail: user.email,
          userName: user.username,
          isBanned: true,
          banReason: reason,
          staffName: staffDisplayName // display name/email for notification only
        }
      });
    } catch (fnError) {
      console.warn('Failed to send ban notification:', fnError);
    }

    await fetchUsers();
    toast({
      title: "Success",
      description: "User has been banned successfully",
    });
  } catch (error) {
    console.error('Error banning user:', error);
    toast({
      title: "Error",
      description: "Failed to ban user",
      variant: "destructive",
    });
  }
};


  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          banned: false,
          banned_at: null,
          banned_by: null
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Success",
        description: "User has been unbanned successfully",
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Success",
        description: "User has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

const resetUserPassword = async (userId: string, email: string) => {
  try {
    // Send ONLY userEmail, not userId or email
    const { error } = await supabase.functions.invoke('reset-user-password', {
      body: { userEmail: email }
    });

    if (error) throw error;

    toast({
      title: "Success",
      description: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    toast({
      title: "Error",
      description: "Failed to send password reset email",
      variant: "destructive",
    });
  }
};

const userEditSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username must be less than 50 characters"),
  full_name: z.string().max(100, "Full name must be less than 100 characters").optional(),
});

const handleUpdateUser = async (userId: string, data: z.infer<typeof userEditSchema>) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        full_name: data.full_name || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    await fetchUsers();
    toast({
      title: "Success",
      description: "User updated successfully",
    });
  } catch (error) {
    console.error('Error updating user:', error);
    toast({
      title: "Error", 
      description: "Failed to update user",
      variant: "destructive",
    });
  }
};


  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "banned" && user.banned) ||
      (statusFilter === "active" && !user.banned) ||
      (statusFilter === "staff" && user.user_roles?.some((role: any) => ['admin', 'moderator'].includes(role.role)));

    return matchesSearch && matchesStatus;
  });

  const getUserRoleBadge = (user: any) => {
    const roles = user.user_roles || [];
    const isAdmin = roles.some((role: any) => role.role === 'admin');
    const isModerator = roles.some((role: any) => role.role === 'moderator');
    
    if (isAdmin) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Admin</Badge>;
    }
    if (isModerator) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Moderator</Badge>;
    }
    return <Badge variant="outline">User</Badge>;
  };

  const UserEditDialog = ({ user, onUserUpdate }: { user: any; onUserUpdate: () => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    const form = useForm<z.infer<typeof userEditSchema>>({
      resolver: zodResolver(userEditSchema),
      defaultValues: {
        username: user?.username || "",
        full_name: user?.full_name || "",
      },
    });

    const onSubmit = async (data: z.infer<typeof userEditSchema>) => {
      await handleUpdateUser(user.id, data);
      setIsEditing(false);
      onUserUpdate();
    };

    const handleCancel = () => {
      form.reset({
        username: user?.username || "",
        full_name: user?.full_name || "",
      });
      setIsEditing(false);
    };

    if (!user) return null;

    return (
      <DialogContent className="bg-gaming-card border-gaming-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-between">
            User Details
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Edit user information" : "View and manage user information"}
          </DialogDescription>
        </DialogHeader>
        
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Username</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gaming-dark border-gaming-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gaming-dark border-gaming-border text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label className="text-foreground">Email</Label>
                <p className="text-sm text-muted-foreground break-all">{user.email} (read-only)</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Username</Label>
                <p className="text-sm text-muted-foreground">{user.username || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-foreground">Email</Label>
                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
              </div>
              <div>
                <Label className="text-foreground">Full Name</Label>
                <p className="text-sm text-muted-foreground">{user.full_name || 'Not set'}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => resetUserPassword(user.id, user.email)}
                size="sm"
              >
                Reset Password
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading users...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Users Section */}
      <ActiveUsersTracker />
      
      {/* User Management Section */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
          <Badge variant="outline" className="text-foreground w-fit">
            {filteredUsers.length} Users
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name, email, or username..."
                className="pl-10 bg-gaming-dark border-gaming-border text-foreground"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-gaming-dark border-gaming-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gaming-card border-gaming-border">
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active Users</SelectItem>
              <SelectItem value="banned">Banned Users</SelectItem>
              <SelectItem value="staff">Staff Members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 bg-gaming-dark border-gaming-border">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground truncate">
                          {user.username || 'No username'}
                        </h3>
                        {getUserRoleBadge(user)}
                        {user.banned && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <UserX className="h-3 w-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.full_name && (
                          <div className="text-muted-foreground">
                            Full name: {user.full_name}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        {user.banned_at && (
                          <div className="flex items-center space-x-2 text-red-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>Banned: {new Date(user.banned_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <UserEditDialog user={selectedUser} onUserUpdate={fetchUsers} />
                    </Dialog>

                    {user.banned ? (
                      <Button
                        onClick={() => handleUnbanUser(user.id)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gaming-card border-gaming-border max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Ban User</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              This will ban {user.username} from the server. Please provide a reason.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-foreground">Ban Reason</Label>
                              <Textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Enter the reason for banning this user..."
                                className="bg-gaming-dark border-gaming-border text-foreground"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
<Button
  onClick={() => {
    handleBanUser(user, banReason); // Only user and reason!
    setBanReason("");
  }}
  variant="destructive"
>
  Ban User
</Button>

                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gaming-card border-gaming-border max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete User</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to permanently delete {user.username}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
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
    </div>
  );
};

export default UserManagementSection;
