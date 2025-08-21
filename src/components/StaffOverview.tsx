import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Shield, UserCheck, Crown, Activity, Clock } from "lucide-react";

interface StaffOverviewProps {
  staffMembers: any[];
}

export const StaffOverview = ({ staffMembers }: StaffOverviewProps) => {
  // Calculate statistics
  const totalStaff = staffMembers.length;
  
  // Group staff by their roles (both legacy and new system)
  const roleStats = staffMembers.reduce((acc, member) => {
    let roleName = member.role;
    let displayName = member.role;
    
    // Handle new staff system
    if (member.staff_roles) {
      roleName = member.staff_roles.name;
      displayName = member.staff_roles.display_name;
    } else {
      // Handle legacy system
      displayName = roleName === 'admin' ? 'Administrator' : 'Moderator';
    }
    
    if (!acc[roleName]) {
      acc[roleName] = {
        count: 0,
        displayName,
        level: member.staff_roles?.hierarchy_level || (roleName === 'admin' ? 80 : 60)
      };
    }
    acc[roleName].count++;
    return acc;
  }, {} as Record<string, { count: number; displayName: string; level: number }>);

  // Sort roles by hierarchy level
  const sortedRoles = Object.entries(roleStats).sort(([,a], [,b]) => 
    (b as { level: number }).level - (a as { level: number }).level
  );
  
  // Keep legacy variables for backward compatibility
  const admins = (roleStats.admin?.count || 0) + (roleStats.super_admin?.count || 0);
  const moderators = roleStats.moderator?.count || 0;

  // Calculate recent activity (last 7 days) - this would need audit logs integration
  const recentActivity = 0; // Placeholder for now

  // Calculate active percentage (this would be based on last login/activity)
  const activeStaff = totalStaff; // Placeholder - assume all active for now
  const activePercentage = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

  const getRoleColor = (member: any) => {
    // Use the color from staff_roles if available, otherwise default colors
    if (member.staff_roles?.color) {
      return { color: member.staff_roles.color };
    }
    
    // Fallback for legacy roles
    switch (member.role) {
      case 'admin': return { color: '#ef4444' }; // red-500
      case 'moderator': return { color: '#3b82f6' }; // blue-500
      default: return { color: '#6b7280' }; // gray-500
    }
  };

  const getRoleIcon = (member: any) => {
    const roleName = member.staff_roles?.name || member.role;
    const hierarchyLevel = member.staff_roles?.hierarchy_level || 
      (member.role === 'admin' ? 80 : member.role === 'moderator' ? 60 : 0);
    
    // Dynamic icon selection based on hierarchy level
    if (hierarchyLevel >= 90) return Crown; // Super admin level
    if (hierarchyLevel >= 70) return Crown; // Admin level  
    if (hierarchyLevel >= 50) return Shield; // Moderator level
    if (hierarchyLevel >= 30) return UserCheck; // Helper level
    return Activity; // Trainee/other levels
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-neon-green" />
            <h3 className="font-semibold text-foreground">Staff Team</h3>
          </div>
          <Badge variant={activeStaff === totalStaff ? "default" : "secondary"}>
            {activeStaff}/{totalStaff} Active
          </Badge>
        </div>

        {/* Main Count */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalStaff}</p>
          <p className="text-sm text-muted-foreground">Active staff members</p>
        </div>

        {/* Role Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Role Distribution</h4>
          
          <div className="space-y-2">
            {sortedRoles.map(([roleName, roleData]) => {
              const roleInfo = roleData as { count: number; displayName: string; level: number };
              // Create a mock member object to get icon and color
              const mockMember = {
                role: roleName,
                staff_roles: staffMembers.find(m => 
                  (m.staff_roles?.name || m.role) === roleName
                )?.staff_roles
              };
              const RoleIcon = getRoleIcon(mockMember);
              const roleStyle = getRoleColor(mockMember);
              
              return (
                <div key={roleName} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <RoleIcon 
                      className="h-3 w-3" 
                      style={{ color: roleStyle.color }} 
                    />
                    <span className="text-muted-foreground">{roleInfo.displayName}</span>
                  </div>
                  <span 
                    className="font-medium" 
                    style={{ color: roleStyle.color }}
                  >
                    {roleInfo.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Status */}
        {totalStaff > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Activity Status</span>
              <span className="font-medium text-foreground">{activePercentage}% Active</span>
            </div>
            <Progress value={activePercentage} className="h-2" />
          </div>
        )}

        {/* Quick Stats - Dynamic top 2 roles */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gaming-border">
          {sortedRoles.slice(0, 2).map(([roleName, roleData]) => {
            const roleInfo = roleData as { count: number; displayName: string; level: number };
            const mockMember = {
              role: roleName,
              staff_roles: staffMembers.find(m => 
                (m.staff_roles?.name || m.role) === roleName
              )?.staff_roles
            };
            const RoleIcon = getRoleIcon(mockMember);
            const roleStyle = getRoleColor(mockMember);
            
            return (
              <div key={roleName} className="text-center">
                <RoleIcon 
                  className="h-4 w-4 mx-auto mb-1 text-muted-foreground" 
                />
                <p className="text-xs text-muted-foreground">{roleInfo.displayName}</p>
                <p 
                  className="text-sm font-medium" 
                  style={{ color: roleStyle.color }}
                >
                  {roleInfo.count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Authority Distribution */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Admin Coverage</span>
              <span className="text-red-400">{totalStaff > 0 ? Math.round((admins / totalStaff) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Mod Coverage</span>
              <span className="text-blue-400">{totalStaff > 0 ? Math.round((moderators / totalStaff) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Staff Health Indicator */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="flex items-center space-x-2">
            <Activity className={`h-4 w-4 ${totalStaff >= 3 ? 'text-green-400' : 'text-yellow-400'}`} />
            <span className={`text-xs ${totalStaff >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalStaff >= 3 ? 'Staff levels optimal' : 'Consider recruiting more staff'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};