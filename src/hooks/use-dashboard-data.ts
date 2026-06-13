"use client";

import { useState } from "react";
import type {
  ActivityItem,
  DashboardMetric,
  RecentDocument,
  TrendDataPoint,
} from "@/lib/mock-data/dashboard";
import { trpc } from "@/lib/trpc/client";
import { getQueryConfig } from "@/lib/trpc/query-config";

export type TrendRange = "7D" | "30D" | "3M" | "YTD";

export interface UseDashboardDataReturn {
  metrics: DashboardMetric[];
  trendData: TrendDataPoint[];
  trendRange: TrendRange;
  setTrendRange: (range: TrendRange) => void;
  activities: ActivityItem[];
  recentDocs: RecentDocument[];
  isLoading: boolean;
  isError: boolean;
  error: { message: string } | null;
  refetch: () => void;
  dataUpdatedAt: number | undefined;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [trendRange, setTrendRange] = useState<TrendRange>("30D");

  // Dashboard metrics: refetch every 30s, stale after 30s
  const dashboardConfig = getQueryConfig("dashboard");

  const metricsQuery = trpc.dashboard.getMetrics.useQuery(undefined, {
    staleTime: dashboardConfig.staleTime,
    gcTime: dashboardConfig.gcTime,
    refetchInterval: 30_000,
    refetchOnWindowFocus: dashboardConfig.refetchOnWindowFocus,
  });

  // Trends: refetch every 30s (same cadence as metrics)
  const trendsQuery = trpc.dashboard.getTrends.useQuery(
    { range: trendRange },
    {
      staleTime: dashboardConfig.staleTime,
      gcTime: dashboardConfig.gcTime,
      refetchInterval: 30_000,
      refetchOnWindowFocus: dashboardConfig.refetchOnWindowFocus,
    },
  );

  // Activity feed: shorter interval (15s) for near-real-time updates
  const activityQuery = trpc.dashboard.getRecentActivity.useQuery(undefined, {
    staleTime: 0,
    gcTime: dashboardConfig.gcTime,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Recent documents: use standard dashboard config
  const recentDocsQuery = trpc.dashboard.getRecentDocuments.useQuery(undefined, {
    staleTime: dashboardConfig.staleTime,
    gcTime: dashboardConfig.gcTime,
    refetchInterval: dashboardConfig.refetchInterval,
    refetchOnWindowFocus: dashboardConfig.refetchOnWindowFocus,
  });

  const isLoading =
    metricsQuery.isLoading ||
    trendsQuery.isLoading ||
    activityQuery.isLoading ||
    recentDocsQuery.isLoading;

  const isError =
    metricsQuery.isError ||
    trendsQuery.isError ||
    activityQuery.isError ||
    recentDocsQuery.isError;

  const error =
    metricsQuery.error ?? trendsQuery.error ?? activityQuery.error ?? recentDocsQuery.error ?? null;

  const refetch = () => {
    void metricsQuery.refetch();
    void trendsQuery.refetch();
    void activityQuery.refetch();
    void recentDocsQuery.refetch();
  };

  return {
    metrics: (metricsQuery.data as DashboardMetric[] | undefined) ?? [],
    trendData: (trendsQuery.data as TrendDataPoint[] | undefined) ?? [],
    trendRange,
    setTrendRange,
    activities: (activityQuery.data as ActivityItem[] | undefined) ?? [],
    recentDocs: (recentDocsQuery.data as RecentDocument[] | undefined) ?? [],
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt: metricsQuery.dataUpdatedAt,
  };
}
