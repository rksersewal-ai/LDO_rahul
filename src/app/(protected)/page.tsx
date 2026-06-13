"use client";

import { useState } from "react";
import { TrendChart } from "@/components/charts/trend-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { KpiDrillModal } from "@/components/dashboard/kpi-drill-modal";
import { RecentDocumentsTable } from "@/components/dashboard/recent-documents-table";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { DrillDownData } from "@/lib/mock-data/dashboard";
import { trpc } from "@/lib/trpc/client";

function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Engineering Document Management System - Overview"
      />
      {/* KPI Grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      {/* Chart + Activity skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-card p-4">
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      {/* Recent docs skeleton */}
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { metrics, trendData, trendRange, setTrendRange, activities, recentDocs, getDrillDown, isLoading, isError, error, refetch } =
    useDashboardData();
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillData, setDrillData] = useState<DrillDownData | undefined>(undefined);

  // PL Breakdown data
  const plBreakdownQuery = trpc.dashboard.getPlBreakdown.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Rolling Stock Summary data
  const rollingStockQuery = trpc.dashboard.getRollingStockSummary.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  function handleDrill(metricId: string) {
    const data = getDrillDown(metricId);
    setDrillData(data);
    setDrillOpen(true);
  }

  // Show loading skeleton while primary queries are pending
  if (isLoading) {
    return (
      <PageFrame size="xl">
        <DashboardLoadingSkeleton />
      </PageFrame>
    );
  }

  // Show error state if queries failed
  if (isError) {
    return (
      <PageFrame size="xl">
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Dashboard"
            subtitle="Engineering Document Management System - Overview"
          />
          <QueryErrorState error={error} retry={refetch} />
        </div>
      </PageFrame>
    );
  }

  const plData = plBreakdownQuery.data;
  const rsData = rollingStockQuery.data;

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

        {/* PL Breakdown + Rolling Stock Summary */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* PL Breakdown Widget */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              PL Number Breakdown
            </h3>
            {plBreakdownQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : plBreakdownQuery.isError ? (
              <QueryErrorState error={plBreakdownQuery.error} retry={() => plBreakdownQuery.refetch()} className="py-4" />
            ) : plData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border bg-muted/30 p-2 text-center">
                    <div className="text-lg font-bold tabular-nums">{plData.total}</div>
                    <div className="text-[10px] text-muted-foreground">Total PLs</div>
                  </div>
                  <div className="rounded-md border bg-green-500/5 p-2 text-center">
                    <div className="text-lg font-bold text-green-700 dark:text-green-400 tabular-nums">
                      {plData.vdCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">VD Items</div>
                  </div>
                  <div className="rounded-md border bg-blue-500/5 p-2 text-center">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                      {plData.nvdCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">NVD Items</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(plData.byCategory).map(([cat, catCount]) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    >
                      {cat}: {catCount}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Safety Critical: <span className="font-semibold text-destructive tabular-nums">{plData.safetyCriticalCount}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Rolling Stock Summary Widget */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Rolling Stock Summary
            </h3>
            {rollingStockQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : rollingStockQuery.isError ? (
              <QueryErrorState error={rollingStockQuery.error} retry={() => rollingStockQuery.refetch()} className="py-4" />
            ) : rsData ? (
              <div className="space-y-3">
                <div className="rounded-md border bg-muted/30 p-2 text-center">
                  <div className="text-lg font-bold tabular-nums">{rsData.total}</div>
                  <div className="text-[10px] text-muted-foreground">Total Units</div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(rsData.byStatus).map(([status, statusCount]) => (
                    <div key={status} className="rounded-md border p-1.5 text-center">
                      <div className="text-sm font-semibold tabular-nums">{statusCount}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {status.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
                {Object.keys(rsData.byProductType).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(rsData.byProductType).map(([type, typeCount]) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize"
                      >
                        {type.replace(/_/g, " ")}: {typeCount}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
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
