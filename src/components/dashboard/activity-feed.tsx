"use client";

import { CheckCircle, FileUp, MessageSquare, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import type { ActivityItem } from "@/lib/mock-data/dashboard";
import { cn } from "@/lib/utils";

const actionConfig: Record<ActivityItem["action"], { icon: typeof FileUp; className: string }> = {
  upload: { icon: FileUp, className: "text-primary" },
  approve: { icon: CheckCircle, className: "text-success" },
  verify: { icon: ShieldCheck, className: "text-chart-5" },
  reject: { icon: XCircle, className: "text-destructive" },
  comment: { icon: MessageSquare, className: "text-muted-foreground" },
  assign: { icon: UserPlus, className: "text-chart-3" },
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="border-b px-4 py-3">
        <h3 className="text-[var(--text-sm)] font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        <div className="divide-y">
          {activities.map((activity) => {
            const config = actionConfig[activity.action];
            const Icon = config.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
              >
                <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", config.className)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[var(--text-xs)] text-foreground">
                    {activity.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[var(--text-xs)] text-muted-foreground">
                    <span>{activity.user}</span>
                    <span className="text-border">|</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
