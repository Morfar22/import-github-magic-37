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
  const admins = staffMembers.filter(member => member.role === 'admin').length;
  const moderators = staffMembers.filter(member => member.role === 'moderator').length;

  // Calculate recent activity (last 7 days) - this would need audit logs integration
  const recentActivity = 0; // Placeholder for now

  // Calculate active percentage (this would be based on last login/activity)
  const activeStaff = totalStaff; // Placeholder - assume all active for now
  const activePercentage = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'moderator': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'moderator': return Shield;
      default: return UserCheck;
    }
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
            {[
              { role: 'admin', count: admins, label: 'Administrators' },
              { role: 'moderator', count: moderators, label: 'Moderators' }
            ].map(({ role, count, label }) => {
              const RoleIcon = getRoleIcon(role);
              return (
                <div key={role} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <RoleIcon className={`h-3 w-3 ${getRoleColor(role)}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <span className={`font-medium ${getRoleColor(role)}`}>{count}</span>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gaming-border">
          <div className="text-center">
            <Crown className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Administrators</p>
            <p className="text-sm font-medium text-red-400">{admins}</p>
          </div>
          
          <div className="text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Moderators</p>
            <p className="text-sm font-medium text-blue-400">{moderators}</p>
          </div>
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