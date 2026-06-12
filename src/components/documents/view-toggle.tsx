"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border p-0.5",
        className,
      )}
    >
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-6 w-6 p-0",
          viewMode === "grid"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onViewModeChange("grid")}
        title="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-6 w-6 p-0",
          viewMode === "list"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onViewModeChange("list")}
        title="List view"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
