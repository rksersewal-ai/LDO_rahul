"use client";

import {
  Activity,
  AlertTriangle,
  Database,
  FileText,
  HardDrive,
  MonitorCheck,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { HealthCard } from "@/components/admin/health-card";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_SYSTEM_HEALTH, MOCK_SYSTEM_METRICS } from "@/lib/mock-data/admin";

const quickLinks = [
  { label: "Users", href: "/admin/users", icon: Users, desc: "Manage user accounts and roles" },
  {
    label: "System Health",
    href: "/admin/health",
    icon: Activity,
    desc: "Detailed service monitoring",
  },
  { label: "OCR Monitor", href: "/admin/ocr", icon: MonitorCheck, desc: "Queue status and jobs" },
  { label: "Audit Log", href: "/admin/audit", icon: Shield, desc: "System activity history" },
  {
    label: "Deduplication",
    href: "/admin/dedup",
    icon: FileText,
    desc: "Duplicate document groups",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Database,
    desc: "System configuration",
  },
  {
    label: "Banners",
    href: "/admin/banners",
    icon: AlertTriangle,
    desc: "System announcements",
  },
];

export default function AdminDashboardPage() {
  const metrics = MOCK_SYSTEM_METRICS;
  const storagePercent = Math.round((metrics.storageUsedGB / metrics.storageTotalGB) * 100);

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="System Administration"
          subtitle="Monitor and manage LDO-2 EDMS platform services"
        />

        {/* Service Health Cards */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Service Health
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {MOCK_SYSTEM_HEALTH.map((service) => (
              <HealthCard key={service.name} service={service} />
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Users" value={metrics.totalUsers} icon={Users} />
            <StatCard label="Active Sessions" value={metrics.activeSessions} icon={Activity} />
            <StatCard label="Documents Today" value={metrics.documentsToday} icon={FileText} />
            <StatCard label="OCR Jobs Today" value={metrics.ocrJobsToday} icon={MonitorCheck} />
            <StatCard
              label="Storage Used"
              value={`${storagePercent}%`}
              icon={HardDrive}
              subtitle={`${metrics.storageUsedGB} / ${metrics.storageTotalGB} GB`}
            />
          </div>
        </section>

        {/* System Indicators */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResourceBar label="CPU Usage" value={metrics.cpuUsage} />
            <ResourceBar label="Memory Usage" value={metrics.memoryUsage} />
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Uptime</p>
              <p className="text-lg font-semibold">
                {Math.floor(metrics.uptimeHours / 24)}d {metrics.uptimeHours % 24}h
              </p>
              <p className="text-[10px] text-muted-foreground">
                {metrics.uptimeHours.toLocaleString()} hours
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Administration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ResourceBar({ label, value }: { label: string; value: number }) {
  const color = value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Badge variant={value > 80 ? "destructive" : "secondary"} className="text-[10px] h-4">
          {value}%
        </Badge>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
