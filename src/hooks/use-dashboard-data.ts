import { useState } from "react";
import {
  type ActivityItem,
  activityFeed,
  type DashboardMetric,
  type DrillDownData,
  dashboardMetrics,
  drillDownData,
  type RecentDocument,
  recentDocuments,
  type TrendDataPoint,
  trendData7D,
  trendData30D,
  trendData90D,
  trendData365D,
} from "@/lib/mock-data/dashboard";

export type TrendRange = "7D" | "30D" | "3M" | "YTD";

const trendDataMap: Record<TrendRange, TrendDataPoint[]> = {
  "7D": trendData7D,
  "30D": trendData30D,
  "3M": trendData90D,
  YTD: trendData365D,
};

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

  return {
    metrics: dashboardMetrics,
    trendData: trendDataMap[trendRange],
    trendRange,
    setTrendRange,
    activities: activityFeed,
    recentDocs: recentDocuments,
    isLoading: false,
    getDrillDown: (metricId: string) => drillDownData[metricId],
  };
}
