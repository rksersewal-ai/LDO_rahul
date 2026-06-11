"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Download,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type { RecentDocument } from "@/lib/mock-data/dashboard";
import { cn } from "@/lib/utils";

type Density = "compact" | "default" | "comfortable";

interface RecentDocumentsTableProps {
  data: RecentDocument[];
  className?: string;
}

const ocrStatusLabels: Record<RecentDocument["ocrStatus"], { label: string; variant: string }> = {
  completed: { label: "Completed", variant: "success" },
  processing: { label: "Processing", variant: "primary" },
  queued: { label: "Queued", variant: "muted" },
  failed: { label: "Failed", variant: "destructive" },
  not_required: { label: "N/A", variant: "muted" },
};

export function RecentDocumentsTable({ data, className }: RecentDocumentsTableProps) {
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<Density>("compact");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.documentNumber.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(page * pageSize, (page + 1) * pageSize);

  const columns: ColumnDef<RecentDocument, unknown>[] = [
    {
      accessorKey: "documentNumber",
      header: "Document #",
      size: 140,
      cell: ({ row }) => (
        <span className="font-medium text-primary">{row.original.documentNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      size: 260,
      cell: ({ row }) => (
        <span className="truncate" title={row.original.title}>
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      size: 110,
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ row }) => <StatusBadge status={row.original.status as StatusType} />,
    },
    {
      accessorKey: "owner",
      header: "Owner",
      size: 130,
    },
    {
      accessorKey: "date",
      header: "Date",
      size: 100,
    },
    {
      accessorKey: "ocrStatus",
      header: "OCR Status",
      size: 110,
      cell: ({ row }) => {
        const ocr = ocrStatusLabels[row.original.ocrStatus];
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[var(--text-xs)]",
              ocr.variant === "success" && "text-success",
              ocr.variant === "primary" && "text-primary",
              ocr.variant === "destructive" && "text-destructive",
              ocr.variant === "muted" && "text-muted-foreground",
            )}
          >
            {ocr.label}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: 40,
      cell: () => (
        <Button variant="ghost" size="icon-xs">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-[var(--button-height)] rounded-md border bg-transparent pl-8 pr-3 text-[var(--text-xs)] placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              style={{ width: "200px" }}
            />
          </div>

          {/* Filter button */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1"
            >
              <Filter className="h-3 w-3" />
              Filter
            </Button>
            {showFilters && (
              <div className="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border bg-popover p-3 shadow-[var(--shadow-popover)]">
                <p className="text-[var(--text-xs)] text-muted-foreground">
                  Filter options coming soon
                </p>
              </div>
            )}
          </div>

          {/* Columns button */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumns(!showColumns)}
              className="gap-1"
            >
              <Columns3 className="h-3 w-3" />
              Columns
            </Button>
            {showColumns && (
              <div className="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border bg-popover p-3 shadow-[var(--shadow-popover)]">
                <p className="text-[var(--text-xs)] text-muted-foreground">
                  Column visibility coming soon
                </p>
              </div>
            )}
          </div>

          {/* Density */}
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value as Density)}
            className="h-[var(--button-height)] rounded-md border bg-transparent px-2 text-[var(--text-xs)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="compact">Compact</option>
            <option value="default">Default</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button variant="outline" size="icon-sm">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Export */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(!showExport)}
              className="gap-1"
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
            {showExport && (
              <div className="absolute top-full right-0 z-20 mt-1 w-32 rounded-lg border bg-popover py-1 shadow-[var(--shadow-popover)]">
                {["CSV", "XLSX", "PDF", "JSON"].map((format) => (
                  <button
                    key={format}
                    type="button"
                    className="flex w-full px-3 py-1.5 text-left text-[var(--text-xs)] text-foreground hover:bg-muted"
                    onClick={() => setShowExport(false)}
                  >
                    {format}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        enableSelection
        className="border-0 shadow-none rounded-none"
      />

      {/* Pagination footer */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <div className="text-[var(--text-xs)] text-muted-foreground">
          {filteredData.length} document{filteredData.length !== 1 ? "s" : ""} total
        </div>
        <div className="flex items-center gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-xs)] text-muted-foreground">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-6 rounded border bg-transparent px-1.5 text-[var(--text-xs)] focus:border-ring focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page indicator */}
          <span className="text-[var(--text-xs)] text-muted-foreground">
            Page {page + 1} of {totalPages || 1}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
