import { FileX2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon ?? <FileX2 className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-[var(--text-lg)] font-medium text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-[var(--text-sm)] text-muted-foreground">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
