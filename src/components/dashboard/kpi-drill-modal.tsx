"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DrillDownData } from "@/lib/mock-data/dashboard";
import { cn } from "@/lib/utils";

interface KpiDrillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DrillDownData | undefined;
}

export function KpiDrillModal({ open, onOpenChange, data }: KpiDrillModalProps) {
  if (!data) return null;

  const maxValue = Math.max(...data.items.map((item) => item.value));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <DialogDescription>Breakdown details for this metric</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-2">
          {data.items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-[var(--text-xs)] text-foreground">
                    {item.label}
                  </span>
                  <span className="ml-2 shrink-0 text-[var(--text-xs)] font-medium text-foreground">
                    {item.value.toLocaleString()}
                    {item.percentage !== undefined && (
                      <span className="ml-1 text-muted-foreground">({item.percentage}%)</span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full bg-primary transition-all")}
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
