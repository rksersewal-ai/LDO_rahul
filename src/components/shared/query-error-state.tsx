"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  error: Error | { message: string } | null;
  retry?: () => void;
  className?: string;
}

export function QueryErrorState({ error, retry, className }: QueryErrorStateProps) {
  const message = error?.message || "An unexpected error occurred. Please try again.";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">Unable to load data</h3>
        <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      </div>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry} className="mt-1 gap-1.5 h-7 text-xs">
          <RotateCcw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
