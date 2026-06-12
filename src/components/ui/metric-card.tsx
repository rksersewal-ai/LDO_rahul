"use client";

import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: string | number;
  deltaDirection?: "up" | "down" | "neutral";
  context?: string;
  drillAction?: () => void;
  tooltip?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaDirection = "neutral",
  context,
  drillAction,
  tooltip,
  icon,
  className,
}: MetricCardProps) {
  return (
    <GlassCard
      interactive
      className={cn(
        "group relative flex flex-col justify-between p-4",
        drillAction && "cursor-pointer",
        className,
      )}
      title={tooltip}
      onClick={drillAction}
      onKeyDown={(e) => {
        if (drillAction && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          drillAction();
        }
      }}
      role={drillAction ? "button" : undefined}
      tabIndex={drillAction ? 0 : undefined}
    >
      {/* Card Top: Label + Delta Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--text-sm)] font-medium text-muted-foreground">{title}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[var(--text-xs)] font-medium",
              deltaDirection === "up" && "bg-success/10 text-success",
              deltaDirection === "down" && "bg-destructive/10 text-destructive",
              deltaDirection === "neutral" && "bg-muted text-muted-foreground",
            )}
          >
            {deltaDirection === "up" && <TrendingUp className="h-3 w-3" />}
            {deltaDirection === "down" && <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>

      {/* Metric Value */}
      <div className="mt-2 flex items-baseline gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <span className="text-[var(--text-3xl)] font-bold tracking-tight text-foreground">
          {value}
        </span>
      </div>

      {/* Context Line */}
      {context && <p className="mt-1 text-[var(--text-xs)] text-muted-foreground">{context}</p>}

      {/* Drill-down indicator */}
      {drillAction && (
        <div className="mt-2 flex items-center text-[var(--text-xs)] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ChevronRight className="ml-0.5 h-3 w-3" />
        </div>
      )}
    </GlassCard>
  );
}
