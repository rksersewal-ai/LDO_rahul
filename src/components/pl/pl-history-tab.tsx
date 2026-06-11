"use client";

import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// Mock history data
const mockHistory = [
  {
    id: "hist-001",
    date: "2024-12-15 14:30",
    action: "Status changed",
    details: "Status changed from 'Under Review' to 'Active'",
    user: "u-002-supervisor",
  },
  {
    id: "hist-002",
    date: "2024-11-20 10:15",
    action: "Specification updated",
    details: "Specification reference updated to latest revision",
    user: "u-003-engineer",
  },
  {
    id: "hist-003",
    date: "2024-10-05 09:00",
    action: "Document linked",
    details: "Drawing document CLW/ED/TM/4907/GA linked",
    user: "u-003-engineer",
  },
  {
    id: "hist-004",
    date: "2024-09-12 16:45",
    action: "Created",
    details: "PL number record created",
    user: "u-001-admin",
  },
];

export function PlHistoryTab() {
  if (mockHistory.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-5 w-5" />}
        title="No history"
        description="Change history for this PL number will appear here."
      />
    );
  }

  return (
    <div className="space-y-0">
      {mockHistory.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
          {/* Timeline line */}
          {index < mockHistory.length - 1 && (
            <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
          )}
          {/* Dot */}
          <div className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{entry.action}</span>
              <span className="text-[10px] text-muted-foreground">{entry.date}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">by {entry.user}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
