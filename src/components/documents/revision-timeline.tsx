"use client";

import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RevisionEntry {
  revision: string;
  date: string;
  uploadedBy: string;
  status: string;
  description: string;
  isCurrent?: boolean;
}

interface RevisionTimelineProps {
  revisions: RevisionEntry[];
  className?: string;
}

export function RevisionTimeline({ revisions, className }: RevisionTimelineProps) {
  if (revisions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center">
        No revision history available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      <div className="flex flex-col gap-3">
        {revisions.map((entry) => {
          const isCurrent = entry.isCurrent;
          return (
            <div key={entry.revision} className="relative flex gap-3 pl-0">
              {/* Timeline node */}
              <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0">
                {isCurrent ? (
                  <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground fill-background" />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 rounded-md border p-2.5",
                  isCurrent ? "border-primary/30 bg-primary/5" : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-xs font-bold",
                        isCurrent ? "text-primary" : "text-foreground",
                      )}
                    >
                      {entry.revision}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {entry.date}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{entry.description}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>By: {entry.uploadedBy}</span>
                  <span className="capitalize">{entry.status.toLowerCase().replace("_", " ")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
