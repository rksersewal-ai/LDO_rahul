"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WorkKpiBadgeProps {
  daysTaken: number;
  targetDays: number;
  className?: string;
}

type KpiStatus = "on-time" | "at-risk" | "overdue";

function getKpiStatus(daysTaken: number, targetDays: number): KpiStatus {
  if (daysTaken > targetDays) return "overdue";
  if (daysTaken > targetDays * 0.75) return "at-risk";
  return "on-time";
}

const statusStyles: Record<KpiStatus, string> = {
  "on-time": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "at-risk": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const dotStyles: Record<KpiStatus, string> = {
  "on-time": "bg-emerald-500",
  "at-risk": "bg-amber-500",
  overdue: "bg-red-500",
};

const statusLabels: Record<KpiStatus, string> = {
  "on-time": "On Time",
  "at-risk": "At Risk (>75% of target used)",
  overdue: "Overdue (exceeded target)",
};

export function WorkKpiBadge({ daysTaken, targetDays, className }: WorkKpiBadgeProps) {
  const status = getKpiStatus(daysTaken, targetDays);

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
            statusStyles[status],
            className,
          )}
        >
          <span className={cn("size-1.5 rounded-full", dotStyles[status])} />
          {daysTaken}/{targetDays}d
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-semibold">{statusLabels[status]}</p>
          <p className="text-muted-foreground">
            {daysTaken} day{daysTaken !== 1 ? "s" : ""} taken of {targetDays} day target
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export type { KpiStatus };
export { getKpiStatus };
