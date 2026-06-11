import { Skeleton } from "@/components/ui/skeleton";

const kpiKeys = ["kpi-a", "kpi-b", "kpi-c", "kpi-d", "kpi-e"];
const rowKeys = ["row-a", "row-b", "row-c", "row-d", "row-e", "row-f", "row-g", "row-h"];

export function PageLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-4 py-4">
        <div className="mx-auto max-w-[1480px] space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-5 gap-3">
            {kpiKeys.map((key) => (
              <Skeleton key={key} className="h-20 rounded-xl" />
            ))}
          </div>

          {/* Table skeleton */}
          <Skeleton className="h-8 w-full rounded-lg" />
          {rowKeys.map((key) => (
            <Skeleton key={key} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
