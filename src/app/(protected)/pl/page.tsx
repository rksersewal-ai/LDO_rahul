"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { type PlFilterState, PlFilters } from "@/components/pl/pl-filters";
import { PlTable } from "@/components/pl/pl-table";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_PL_NUMBERS } from "@/lib/mock-data/pl-numbers";

export default function PlHubPage() {
  const [filters, setFilters] = useState<PlFilterState>({
    search: "",
    category: "",
    status: "",
    workshop: "",
    safetyOnly: false,
  });

  // Apply filters to mock data client-side for now
  const filteredData = MOCK_PL_NUMBERS.filter((pl) => {
    if (
      filters.search &&
      !pl.plNumber.includes(filters.search) &&
      !pl.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !pl.description.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.category && pl.category !== filters.category) return false;
    if (filters.status && pl.status !== filters.status) return false;
    if (filters.workshop && pl.workshop !== filters.workshop) return false;
    if (filters.safetyOnly && !pl.safetyCritical) return false;
    return true;
  });

  const exportRows = useMemo(
    () =>
      filteredData.map((pl) => [
        pl.plNumber,
        pl.name,
        pl.category,
        pl.status,
        pl.workshop,
        pl.safetyCritical ? "Yes" : "No",
      ]),
    [filteredData],
  );

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="PL Knowledge Hub"
          subtitle="Central registry of all Parts List numbers"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
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
        <PlFilters filters={filters} onFiltersChange={setFilters} />

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredData.length} of {MOCK_PL_NUMBERS.length} PL numbers
          </p>
        </div>

        {/* Data Table */}
        <PlTable data={filteredData} />
      </div>
    </PageFrame>
  );
}
