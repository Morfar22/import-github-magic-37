import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";

interface ApplicationsOverviewProps {
  applications: any[];
}

export const ApplicationsOverview = ({ applications }: ApplicationsOverviewProps) => {
  // Calculate statistics
  const totalApps = applications.length;
  const pendingApps = applications.filter(app => app.status === 'pending').length;
  const approvedApps = applications.filter(app => app.status === 'approved').length;
  const rejectedApps = applications.filter(app => app.status === 'rejected').length;
  const underReviewApps = applications.filter(app => app.status === 'under_review').length;

  // Calculate recent activity (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentApps = applications.filter(app => 
    new Date(app.created_at) >= oneWeekAgo
  ).length;

  // Calculate approval rate
  const processedApps = approvedApps + rejectedApps;
  const approvalRate = processedApps > 0 ? Math.round((approvedApps / processedApps) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'under_review': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'under_review': return AlertCircle;
      default: return FileText;
    }
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-neon-blue" />
            <h3 className="font-semibold text-foreground">Applications</h3>
          </div>
          <Badge variant={recentApps > 0 ? "default" : "secondary"}>
            {recentApps} this week
          </Badge>
        </div>

        {/* Main Count */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalApps}</p>
          <p className="text-sm text-muted-foreground">Total applications</p>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Status Breakdown</h4>
          
          <div className="space-y-2">
            {[
              { status: 'pending', count: pendingApps, label: 'Pending Review' },
              { status: 'under_review', count: underReviewApps, label: 'Under Review' },
              { status: 'approved', count: approvedApps, label: 'Approved' },
              { status: 'rejected', count: rejectedApps, label: 'Rejected' }
            ].map(({ status, count, label }) => {
              const StatusIcon = getStatusIcon(status);
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-3 w-3 ${getStatusColor(status)}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <span className={`font-medium ${getStatusColor(status)}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approval Rate */}
        {processedApps > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approval Rate</span>
              <span className="font-medium text-foreground">{approvalRate}%</span>
            </div>
            <Progress value={approvalRate} className="h-2" />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gaming-border">
          <div className="text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Recent Activity</p>
            <p className="text-sm font-medium text-foreground">{recentApps} new</p>
          </div>
          
          <div className="text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Needs Action</p>
            <p className="text-sm font-medium text-foreground">{pendingApps + underReviewApps}</p>
          </div>
        </div>

        {/* Quick Action Indicator */}
        {(pendingApps + underReviewApps) > 0 && (
          <div className="pt-3 border-t border-gaming-border">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-yellow-400">
                {pendingApps + underReviewApps} application{(pendingApps + underReviewApps) !== 1 ? 's' : ''} waiting for review
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};