"use client";

import type { OcrStatus } from "@/lib/mock-data/documents";
import { cn } from "@/lib/utils";

interface OcrStatusBadgeProps {
  status: OcrStatus;
  confidence?: number | null;
  className?: string;
}

const ocrStatusConfig: Record<
  OcrStatus,
  { dotClass: string; labelClass: string; bgClass: string; label: string }
> = {
  PENDING: {
    dotClass: "bg-muted-foreground",
    labelClass: "text-muted-foreground",
    bgClass: "bg-muted",
    label: "Pending",
  },
  PROCESSING: {
    dotClass: "bg-blue-500 animate-pulse",
    labelClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    label: "Processing",
  },
  COMPLETED: {
    dotClass: "bg-success",
    labelClass: "text-success",
    bgClass: "bg-success/10",
    label: "Completed",
  },
  FAILED: {
    dotClass: "bg-destructive",
    labelClass: "text-destructive",
    bgClass: "bg-destructive/10",
    label: "Failed",
  },
  FLAGGED: {
    dotClass: "bg-warning",
    labelClass: "text-warning",
    bgClass: "bg-warning/10",
    label: "Flagged",
  },
  SKIPPED: {
    dotClass: "bg-muted-foreground",
    labelClass: "text-muted-foreground",
    bgClass: "bg-muted",
    label: "Skipped",
  },
  NOT_REQUIRED: {
    dotClass: "bg-muted-foreground",
    labelClass: "text-muted-foreground",
    bgClass: "bg-muted",
    label: "N/A",
  },
};

export function OcrStatusBadge({ status, confidence, className }: OcrStatusBadgeProps) {
  const config = ocrStatusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        config.bgClass,
        config.labelClass,
        className,
      )}
    >
      <span className={cn("inline-block shrink-0 h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {config.label}
      {confidence != null && status === "COMPLETED" && (
        <span className="ml-0.5 opacity-75">{confidence}%</span>
      )}
    </span>
  );
}
