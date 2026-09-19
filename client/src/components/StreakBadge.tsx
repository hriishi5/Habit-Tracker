import React from "react";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  size = "md",
  showLabel = true,
}) => {
  const isZero = streak <= 0;
  const isHigh = streak >= 7;
  const isLegendary = streak >= 30;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  let colorClasses = "bg-slate-800/80 text-slate-400 border-slate-700/50";
  let flameColor = "text-slate-500";

  if (!isZero) {
    if (isLegendary) {
      colorClasses = "bg-amber-950/70 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20";
      flameColor = "text-amber-400 animate-flame-flicker flame-glow";
    } else if (isHigh) {
      colorClasses = "bg-orange-950/70 text-orange-300 border-orange-500/50 shadow-md shadow-orange-500/10";
      flameColor = "text-orange-400 animate-pulse-subtle flame-glow";
    } else {
      colorClasses = "bg-orange-950/40 text-orange-300 border-orange-500/30";
      flameColor = "text-orange-400";
    }
  }

  return (
    <div
      className={`inline-flex items-center font-bold rounded-full border transition-all select-none ${sizeClasses[size]} ${colorClasses}`}
      title={`${streak} day streak`}
    >
      <Flame className={`${iconSizes[size]} ${flameColor} shrink-0`} />
      <span className="tabular-nums">{streak}</span>
      {showLabel && <span className="font-normal opacity-80">{streak === 1 ? "day" : "days"}</span>}
    </div>
  );
};
