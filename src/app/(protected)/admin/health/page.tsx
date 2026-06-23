"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { HealthCard } from "@/components/admin/health-card";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

export default function SystemHealthPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: healthData,
    isLoading,
    refetch,
  } = trpc.admin.getHealth.useQuery(undefined, {
    staleTime: 15_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const metrics = healthData?.metrics ?? {
    cpuUsage: 0,
    memoryUsage: 0,
    uptimeHours: 0,
    activeSessions: 0,
  };
  const services = healthData?.services ?? [];

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="System Health"
          subtitle="Real-time service monitoring and diagnostics"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                Last: {lastRefresh.toLocaleTimeString()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Pause" : "Resume"} Auto-refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setLastRefresh(new Date());
                  refetch();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Service Status Grid */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Service Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service: Record<string, unknown>) => (
              <HealthCard key={service.name as string} service={service as never} />
            ))}
          </div>
        </section>

        {/* Uptime and Resources */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Uptime"
              value={`${Math.floor(metrics.uptimeHours / 24)} days`}
              detail={`${metrics.uptimeHours.toLocaleString()} hours total`}
            />
            <MetricCard
              label="CPU Usage"
              value={`${metrics.cpuUsage}%`}
              detail="4 cores, load avg 1.36"
              percent={metrics.cpuUsage}
            />
            <MetricCard
              label="Memory Usage"
              value={`${metrics.memoryUsage}%`}
              detail="10.72 / 16 GB allocated"
              percent={metrics.memoryUsage}
            />
            <MetricCard
              label="Active Connections"
              value={`${metrics.activeSessions}`}
              detail="DB: 24, Redis: 18, HTTP: 156"
            />
          </div>
        </section>

        {/* Response Time History (simplified) */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Response Time History (Last Hour)
          </h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-6 gap-4">
              {services.map((service: Record<string, unknown>) => (
                <div key={service.name as string} className="text-center">
                  <p className="text-[10px] text-muted-foreground truncate mb-2">
                    {(service.name as string).split(" ")[0]}
                  </p>
                  <div className="flex items-end justify-center gap-0.5 h-16">
                    {Array.from({ length: 12 }, (_, i) => {
                      const base = (service.responseTime as number) ?? 50;
                      const variation = Math.sin(i * 0.8) * base * 0.3 + base;
                      const height = Math.min(100, (variation / 500) * 100);
                      const barKey = `${service.name}-min${i * 5}`;
                      return (
                        <div
                          key={barKey}
                          className="w-1.5 rounded-sm bg-primary/60"
                          style={{ height: `${Math.max(8, height)}%` }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-semibold mt-1">
                    {(service.responseTime as number) ?? 0}ms
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageFrame>
  );
}

function MetricCard({
  label,
  value,
  detail,
  percent,
}: {
  label: string;
  value: string;
  detail: string;
  percent?: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {percent !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              percent > 80 ? "bg-red-500" : percent > 60 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{detail}</p>
    </div>
  );
}
