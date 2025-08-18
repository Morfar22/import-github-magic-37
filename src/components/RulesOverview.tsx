import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, BookOpen, AlertTriangle, CheckCircle, BarChart3, Clock } from "lucide-react";

interface RulesOverviewProps {
  rules: any[];
}

export const RulesOverview = ({ rules }: RulesOverviewProps) => {
  // Calculate statistics
  const totalRules = rules.length;
  const activeRules = rules.filter(rule => rule.is_active).length;
  const inactiveRules = totalRules - activeRules;

  // Group by category
  const categories = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = 0;
    }
    if (rule.is_active) {
      acc[rule.category]++;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryCount = Object.keys(categories).length;

  // Calculate recent updates (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentUpdates = rules.filter(rule => 
    new Date(rule.updated_at) >= oneWeekAgo
  ).length;

  // Calculate coverage percentage
  const coveragePercentage = totalRules > 0 ? Math.round((activeRules / totalRules) * 100) : 0;

  const getCategoryColor = (index: number) => {
    const colors = ['text-blue-400', 'text-green-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400'];
    return colors[index % colors.length];
  };

  const topCategories = Object.entries(categories)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-neon-purple" />
            <h3 className="font-semibold text-foreground">Server Rules</h3>
          </div>
          <Badge variant={recentUpdates > 0 ? "default" : "secondary"}>
            {recentUpdates > 0 ? `${recentUpdates} updated` : 'Up to date'}
          </Badge>
        </div>

        {/* Main Count */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalRules}</p>
          <p className="text-sm text-muted-foreground">Total server rules</p>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Rule Status</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-muted-foreground">Active Rules</span>
              </div>
              <span className="font-medium text-green-400">{activeRules}</span>
            </div>
            
            {inactiveRules > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                  <span className="text-muted-foreground">Inactive Rules</span>
                </div>
                <span className="font-medium text-yellow-400">{inactiveRules}</span>
              </div>
            )}
          </div>
        </div>

        {/* Coverage Percentage */}
        {totalRules > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Coverage</span>
              <span className="font-medium text-foreground">{coveragePercentage}%</span>
            </div>
            <Progress value={coveragePercentage} className="h-2" />
          </div>
        )}

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Top Categories</h4>
            
            <div className="space-y-2">
              {topCategories.map(([category, count], index) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(index).replace('text-', 'bg-')}`} />
                    <span className="text-muted-foreground capitalize">{category}</span>
                  </div>
                  <span className={`font-medium ${getCategoryColor(index)}`}>{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gaming-border">
          <div className="text-center">
            <BookOpen className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-sm font-medium text-foreground">{categoryCount}</p>
          </div>
          
          <div className="text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Avg per Category</p>
            <p className="text-sm font-medium text-foreground">
              {categoryCount > 0 ? Math.round(activeRules / categoryCount) : 0}
            </p>
          </div>
        </div>

        {/* Rules Health */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="flex items-center space-x-2">
            {totalRules >= 10 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-400">Comprehensive rule coverage</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-yellow-400">Consider adding more rules for better coverage</span>
              </>
            )}
          </div>
        </div>

        {/* Recent Updates Indicator */}
        {recentUpdates > 0 && (
          <div className="pt-3 border-t border-gaming-border">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-blue-400">
                {recentUpdates} rule{recentUpdates !== 1 ? 's' : ''} updated this week
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};