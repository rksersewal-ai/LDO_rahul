import { cn } from "@/lib/utils";

export type StatusType = "done" | "in_process" | "pending" | "failed" | "blocked";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<StatusType, { dotClass: string; labelClass: string; bgClass: string }> =
  {
    done: {
      dotClass: "bg-success",
      labelClass: "text-success",
      bgClass: "bg-success/10",
    },
    in_process: {
      dotClass: "bg-primary",
      labelClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    pending: {
      dotClass: "bg-muted-foreground",
      labelClass: "text-muted-foreground",
      bgClass: "bg-muted",
    },
    failed: {
      dotClass: "bg-destructive",
      labelClass: "text-destructive",
      bgClass: "bg-destructive/10",
    },
    blocked: {
      dotClass: "bg-warning",
      labelClass: "text-warning",
      bgClass: "bg-warning/10",
    },
  };

const defaultLabels: Record<StatusType, string> = {
  done: "Done",
  in_process: "In Process",
  pending: "Pending",
  failed: "Failed",
  blocked: "Blocked",
};

export function StatusBadge({ status, label, size = "sm", className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? defaultLabels[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgClass,
        config.labelClass,
        size === "sm" && "px-2 py-0.5 text-[var(--text-xs)]",
        size === "md" && "px-2.5 py-1 text-[var(--text-sm)]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block shrink-0 rounded-full",
          config.dotClass,
          size === "sm" && "h-1.5 w-1.5",
          size === "md" && "h-2 w-2",
        )}
      />
      {displayLabel}
    </span>
  );
}
