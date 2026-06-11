"use client";

import { useState } from "react";
import { TrendChart } from "@/components/charts/trend-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { KpiDrillModal } from "@/components/dashboard/kpi-drill-modal";
import { RecentDocumentsTable } from "@/components/dashboard/recent-documents-table";
import { PageFrame } from "@/components/layout/page-frame";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { DrillDownData } from "@/lib/mock-data/dashboard";

export default function DashboardPage() {
  const { metrics, trendData, trendRange, setTrendRange, activities, recentDocs, getDrillDown } =
    useDashboardData();
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillData, setDrillData] = useState<DrillDownData | undefined>(undefined);

  function handleDrill(metricId: string) {
    const data = getDrillDown(metricId);
    setDrillData(data);
    setDrillOpen(true);
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <PageHeader
          title="Dashboard"
          subtitle="Engineering Document Management System - Overview"
        />

        {/* KPI Grid - 5 cards per row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              delta={metric.delta}
              deltaDirection={metric.deltaDirection}
              context={metric.context}
              drillAction={() => handleDrill(metric.id)}
            />
          ))}
        </div>

        {/* Chart + Activity Feed row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TrendChart
            data={trendData}
            range={trendRange}
            onRangeChange={setTrendRange}
            className="lg:col-span-2"
          />
          <ActivityFeed activities={activities} />
        </div>

        {/* Recent Documents Table */}
        <div>
          <h3 className="mb-3 text-[var(--text-sm)] font-semibold text-foreground">
            Recent Documents
          </h3>
          <RecentDocumentsTable data={recentDocs} />
        </div>
      </div>

      {/* Drill-down modal */}
      <KpiDrillModal open={drillOpen} onOpenChange={setDrillOpen} data={drillData} />
    </PageFrame>
  );
}
