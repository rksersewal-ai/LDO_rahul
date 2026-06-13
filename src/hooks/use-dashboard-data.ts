"use client";

import { useState } from "react";
import type {
  ActivityItem,
  DashboardMetric,
  DrillDownData,
  RecentDocument,
  TrendDataPoint,
} from "@/lib/mock-data/dashboard";
import { drillDownData } from "@/lib/mock-data/dashboard";
import { trpc } from "@/lib/trpc/client";

export type TrendRange = "7D" | "30D" | "3M" | "YTD";

export interface UseDashboardDataReturn {
  metrics: DashboardMetric[];
  trendData: TrendDataPoint[];
  trendRange: TrendRange;
  setTrendRange: (range: TrendRange) => void;
  activities: ActivityItem[];
  recentDocs: RecentDocument[];
  isLoading: boolean;
  getDrillDown: (metricId: string) => DrillDownData | undefined;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [trendRange, setTrendRange] = useState<TrendRange>("30D");

  const metricsQuery = trpc.dashboard.getMetrics.useQuery();
  const trendsQuery = trpc.dashboard.getTrends.useQuery({ range: trendRange });
  const activityQuery = trpc.dashboard.getRecentActivity.useQuery();
  const recentDocsQuery = trpc.dashboard.getRecentDocuments.useQuery();

  const isLoading =
    metricsQuery.isLoading ||
    trendsQuery.isLoading ||
    activityQuery.isLoading ||
    recentDocsQuery.isLoading;

  return {
    metrics: (metricsQuery.data as DashboardMetric[] | undefined) ?? [],
    trendData: (trendsQuery.data as TrendDataPoint[] | undefined) ?? [],
    trendRange,
    setTrendRange,
    activities: (activityQuery.data as ActivityItem[] | undefined) ?? [],
    recentDocs: (recentDocsQuery.data as RecentDocument[] | undefined) ?? [],
    isLoading,
    getDrillDown: (metricId: string) => drillDownData[metricId],
  };
}
