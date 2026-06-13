"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { type PlFilterState, PlFilters } from "@/components/pl/pl-filters";
import { PlTable } from "@/components/pl/pl-table";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

export default function PlHubPage() {
  const [filters, setFilters] = useState<PlFilterState>({
    search: "",
    category: "",
    status: "",
    workshop: "",
    lifecycleStage: "",
    safetyOnly: false,
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const { data, isLoading, error, refetch } = trpc.pl.list.useQuery({
    search: filters.search || undefined,
    category: (filters.category as "CAT-A" | "CAT-B" | "CAT-C" | "CAT-D") || undefined,
    status:
      (filters.status as
        | "active"
        | "inactive"
        | "deprecated"
        | "under_review"
        | "obsolete") || undefined,
    workshop: filters.workshop || undefined,
    lifecycleStage:
      (filters.lifecycleStage as
        | "draft"
        | "active"
        | "restricted"
        | "obsolete"
        | "deprecated") || undefined,
    safetyCritical: filters.safetyOnly ? true : undefined,
    page,
    pageSize,
  });

  const exportRows = useMemo(
    () =>
      (data?.data ?? []).map((pl) => [
        pl.plNumber,
        pl.name,
        pl.category,
        pl.status,
        pl.workshop ?? "",
        pl.safetyCritical ? "Yes" : "No",
      ]),
    [data],
  );

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="PL Knowledge Hub"
          subtitle="Central registry of all Parts List numbers"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <ExportDropdown
                title="PL Knowledge Hub"
                headers={["PL Number", "Name", "Category", "Status", "Workshop", "Safety Critical"]}
                rows={exportRows}
                filenamePrefix="pl-numbers"
              />
              <Button size="sm" className="h-7 text-xs gap-1" render={<Link href="/pl/new" />}>
                <Plus className="h-3 w-3" />
                Create PL
              </Button>
            </div>
          }
        />

        {/* Filters toolbar */}
        <PlFilters filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} />

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {data
              ? `Showing ${data.data.length} of ${data.totalCount} PL numbers (page ${data.page})`
              : "Loading..."}
          </p>
          {data && data.totalCount > pageSize && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                disabled={page * pageSize >= data.totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Loading / Error / Data Table */}
        {isLoading ? (
          <LoadingState variant="table" rows={8} />
        ) : error ? (
          <QueryErrorState error={error} retry={() => refetch()} />
        ) : (
          <PlTable data={data?.data ?? []} />
        )}
      </div>
    </PageFrame>
  );
}
