import { Crown, Star, Diamond, Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SupporterTier {
  tier: string;
  totalDonated: number;
}

interface SupporterBadgeProps {
  tier: string;
  totalDonated?: number;
  className?: string;
  showAmount?: boolean;
  size?: "sm" | "md" | "lg";
}

const tierConfig = {
  diamond: {
    icon: Diamond,
    label: "Diamond Supporter",
    color: "from-cyan-400 to-blue-500",
    textColor: "text-cyan-100",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.4)]",
    minAmount: 500
  },
  platinum: {
    icon: Crown,
    label: "Platinum Supporter", 
    color: "from-gray-300 to-gray-500",
    textColor: "text-gray-100",
    glow: "shadow-[0_0_20px_rgba(156,163,175,0.4)]",
    minAmount: 250
  },
  gold: {
    icon: Trophy,
    label: "Gold Supporter",
    color: "from-yellow-400 to-orange-500",
    textColor: "text-yellow-100", 
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
    minAmount: 100
  },
  silver: {
    icon: Star,
    label: "Silver Supporter",
    color: "from-gray-400 to-gray-600",
    textColor: "text-gray-100",
    glow: "shadow-[0_0_15px_rgba(156,163,175,0.3)]",
    minAmount: 50
  },
  bronze: {
    icon: Medal,
    label: "Bronze Supporter",
    color: "from-orange-600 to-red-700",
    textColor: "text-orange-100",
    glow: "shadow-[0_0_10px_rgba(234,88,12,0.3)]",
    minAmount: 5
  }
};

export function SupporterBadge({ 
  tier, 
  totalDonated = 0, 
  className, 
  showAmount = false,
  size = "md" 
}: SupporterBadgeProps) {
  if (tier === 'none' || !tierConfig[tier as keyof typeof tierConfig]) {
    return null;
  }

  const config = tierConfig[tier as keyof typeof tierConfig];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5", 
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <Badge
      className={cn(
        `bg-gradient-to-r ${config.color} ${config.textColor} border-0 font-bold`,
        `${config.glow} hover:scale-105 transition-all duration-300`,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn("mr-1", iconSizes[size])} />
      {config.label}
      {showAmount && totalDonated > 0 && (
        <span className="ml-1 opacity-90">
          (${(totalDonated / 100).toFixed(0)})
        </span>
      )}
    </Badge>
  );
}

export function useSupporterTier(totalDonated: number): string {
  if (totalDonated >= 50000) return 'diamond';
  if (totalDonated >= 25000) return 'platinum'; 
  if (totalDonated >= 10000) return 'gold';
  if (totalDonated >= 5000) return 'silver';
  if (totalDonated > 0) return 'bronze';
  return 'none';
}