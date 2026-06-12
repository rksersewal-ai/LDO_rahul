"use client";

import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export interface SearchMetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * SearchMetricCard - A compact metric card used in the search page bento strip.
 * Uses GlassCard for consistent interactive glass-card styling.
 */
export function SearchMetricCard({ label, value, hint, icon, className }: SearchMetricCardProps) {
  return (
    <GlassCard className={cn("p-3 text-left", className)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-primary">{icon}</span>}
        <p className="text-[var(--text-xs)] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1.5 font-mono text-lg font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </GlassCard>
  );
}
