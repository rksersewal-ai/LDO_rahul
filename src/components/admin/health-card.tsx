"use client";

import type { ServiceHealth, ServiceStatus } from "@/lib/mock-data/admin";
import { cn } from "@/lib/utils";

const statusConfig: Record<ServiceStatus, { dot: string; label: string; bg: string }> = {
  healthy: { dot: "bg-emerald-500", label: "Healthy", bg: "bg-emerald-500/10" },
  degraded: { dot: "bg-amber-500", label: "Degraded", bg: "bg-amber-500/10" },
  down: { dot: "bg-red-500", label: "Down", bg: "bg-red-500/10" },
};

interface HealthCardProps {
  service: ServiceHealth;
  className?: string;
}

export function HealthCard({ service, className }: HealthCardProps) {
  const config = statusConfig[service.status];

  return (
    <div className={cn("rounded-lg border bg-card p-4 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground truncate">{service.name}</h3>
        <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5", config.bg)}>
          <span className={cn("size-2 rounded-full animate-pulse", config.dot)} />
          <span className="text-[10px] font-medium">{config.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground">Response</p>
          <p className="font-semibold">{service.responseTime}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">Uptime</p>
          <p className="font-semibold">{service.uptime}%</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight">{service.details}</p>
    </div>
  );
}
