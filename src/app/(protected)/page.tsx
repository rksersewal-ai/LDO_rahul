"use client";

import { Clock, Download } from "lucide-react";
import { useState } from "react";
import { TrendChart } from "@/components/charts/trend-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { KpiDrillModal } from "@/components/dashboard/kpi-drill-modal";
import { RecentDocumentsTable } from "@/components/dashboard/recent-documents-table";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComparePeriod } from "@/hooks/use-dashboard-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { trpc } from "@/lib/trpc/client";
import { exportToCSV } from "@/lib/utils/export-service";

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
      <PageHeader title="Dashboard" subtitle="Engineering Document Management System - Overview" />
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
  const [comparePeriod, setComparePeriod] = useState<ComparePeriod>("week");
  const {
    metrics,
    trendData,
    trendRange,
    setTrendRange,
    activities,
    recentDocs,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useDashboardData(comparePeriod);
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillMetricId, setDrillMetricId] = useState<string | null>(null);
  const [drillMetricTitle, setDrillMetricTitle] = useState("");

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

  // Pending Approvals for the summary table
  const pendingApprovalsQuery = trpc.dashboard.getPendingApprovals.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  function handleDrill(metricId: string) {
    const metric = metrics.find((m) => m.id === metricId);
    setDrillMetricId(metricId);
    setDrillMetricTitle(metric?.title ?? "Drill Down");
    setDrillOpen(true);
  }

  function handleExportDashboard() {
    const headers = ["Metric", "Value", "Change", "Context"];
    const rows = metrics.map((m) => [m.title, String(m.value), m.delta, m.context]);
    exportToCSV(headers, rows, "dashboard-summary");
  }

  // Format the refresh timestamp
  const lastRefreshed = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : null;

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
  const pendingApprovals = pendingApprovalsQuery.data ?? [];

  // Compute context string based on compare period - now comes from server
  const getContextString = (metric: (typeof metrics)[0]) => {
    return metric.context;
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-6">
        {/* Page header with actions */}
        <PageHeader
          title="Dashboard"
          subtitle="Engineering Document Management System - Overview"
          actions={
            <div className="flex items-center gap-3">
              {/* Last refreshed timestamp */}
              {lastRefreshed && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="tabular-nums">Last refreshed: {lastRefreshed}</span>
                </div>
              )}
              {/* Compare Period toggle */}
              <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
                <button
                  type="button"
                  className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                    comparePeriod === "week"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setComparePeriod("week")}
                >
                  vs Prev Week
                </button>
                <button
                  type="button"
                  className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                    comparePeriod === "month"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setComparePeriod("month")}
                >
                  vs Prev Month
                </button>
              </div>
              {/* Export Dashboard */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={handleExportDashboard}
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          }
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
              context={getContextString(metric)}
              drillAction={() => handleDrill(metric.id)}
            />
          ))}
        </div>

        {/* Pending Approvals Summary Table */}
        {pendingApprovals.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Pending Approvals</h3>
              <Badge variant="secondary" className="tabular-nums">
                {pendingApprovals.length} pending
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Document #</th>
                    <th className="pb-2 pr-4 font-medium">Title</th>
                    <th className="pb-2 pr-4 font-medium">Requested By</th>
                    <th className="pb-2 pr-4 font-medium">Level</th>
                    <th className="pb-2 font-medium text-right">Days Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((approval) => (
                    <tr key={approval.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium text-primary">
                        {approval.documentNumber}
                      </td>
                      <td className="py-2 pr-4 max-w-[200px] truncate" title={approval.title}>
                        {approval.title}
                      </td>
                      <td className="py-2 pr-4">{approval.requestedBy}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {approval.level}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span
                          className={
                            approval.daysPending > 2
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {approval.daysPending}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PL Breakdown + Rolling Stock Summary */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* PL Breakdown Widget */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">PL Number Breakdown</h3>
            {plBreakdownQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : plBreakdownQuery.isError ? (
              <QueryErrorState
                error={plBreakdownQuery.error}
                retry={() => plBreakdownQuery.refetch()}
                className="py-4"
              />
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
                  Safety Critical:{" "}
                  <span className="font-semibold text-destructive tabular-nums">
                    {plData.safetyCriticalCount}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Rolling Stock Summary Widget */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Rolling Stock Summary</h3>
            {rollingStockQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : rollingStockQuery.isError ? (
              <QueryErrorState
                error={rollingStockQuery.error}
                retry={() => rollingStockQuery.refetch()}
                className="py-4"
              />
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
      <KpiDrillModal
        open={drillOpen}
        onOpenChange={setDrillOpen}
        metricId={drillMetricId}
        metricTitle={drillMetricTitle}
      />
    </PageFrame>
  );
}
