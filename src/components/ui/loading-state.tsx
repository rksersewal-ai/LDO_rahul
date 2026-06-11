import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export interface LoadingStateProps {
  variant?: "table" | "spinner" | "card";
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingState({
  variant = "spinner",
  rows = 5,
  columns = 4,
  className,
}: LoadingStateProps) {
  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-1", className)}>
        {/* Header skeleton */}
        <div className="flex gap-3 rounded-md bg-muted/50 px-3 py-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i.toString()}`} className="h-3 flex-1" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-${i.toString()}`}
            className="flex gap-3 px-3 py-2"
            style={{ height: "var(--table-row-height)" }}
          >
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={`cell-${i.toString()}-${j.toString()}`} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // card variant
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`card-${i.toString()}`} className="rounded-lg border p-4">
          <Skeleton className="mb-2 h-3 w-2/3" />
          <Skeleton className="mb-1 h-7 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
