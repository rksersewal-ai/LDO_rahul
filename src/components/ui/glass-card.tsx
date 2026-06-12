"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.ComponentProps<"div"> {
  /** When true, adds hover translate + border-primary transition and cursor-pointer */
  interactive?: boolean;
}

/**
 * GlassCard - A reusable card wrapper using design tokens for consistent
 * glass-card styling across the application.
 *
 * Base: bg-card, border border-border, rounded-[var(--radius)], shadow-[var(--shadow-card)]
 * Interactive hover: translateY(-1px) + border-primary/30 + shadow-md
 *
 * Works with both light and dark themes via OKLCH CSS variables.
 */
export function GlassCard({ className, interactive = false, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-[var(--radius)] shadow-[var(--shadow-card)]",
        "transition-all duration-200 ease-out",
        interactive &&
          "hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-md cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
