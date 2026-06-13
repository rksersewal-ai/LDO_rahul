/**
 * React Query configuration helpers for different data categories.
 * Controls staleTime, gcTime, and refetchInterval to reduce unnecessary refetches
 * while keeping critical data fresh.
 */

export interface QueryConfig {
  staleTime: number;
  gcTime: number;
  refetchInterval?: number;
  refetchOnWindowFocus: boolean;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const configs: Record<"dashboard" | "documents" | "settings" | "realtime", QueryConfig> = {
  /** Dashboard KPIs and trends - moderate refresh rate */
  dashboard: {
    staleTime: 30 * SECOND,
    gcTime: 5 * MINUTE,
    refetchInterval: 30 * SECOND,
    refetchOnWindowFocus: true,
  },
  /** Document lists - more dynamic, shorter staleness */
  documents: {
    staleTime: 5 * SECOND,
    gcTime: 2 * MINUTE,
    refetchOnWindowFocus: true,
  },
  /** Settings - rarely change, long cache */
  settings: {
    staleTime: 60 * SECOND,
    gcTime: 10 * MINUTE,
    refetchOnWindowFocus: false,
  },
  /** Real-time feeds - always fresh */
  realtime: {
    staleTime: 0,
    gcTime: 2 * MINUTE,
    refetchInterval: 5 * SECOND,
    refetchOnWindowFocus: true,
  },
};

/**
 * Returns React Query options for a given data category.
 * Use in tRPC useQuery calls to control caching behavior.
 *
 * @example
 * trpc.dashboard.getMetrics.useQuery(undefined, getQueryConfig('dashboard'))
 */
export function getQueryConfig(
  category: "dashboard" | "documents" | "settings" | "realtime",
): QueryConfig {
  return configs[category];
}
