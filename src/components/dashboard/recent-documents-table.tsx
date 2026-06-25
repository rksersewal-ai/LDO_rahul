"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type { RecentDocument } from "@/lib/mock-data/dashboard";
import { cn } from "@/lib/utils";

type Density = "compact" | "default" | "comfortable";

interface RecentDocumentsTableProps {
  data: RecentDocument[];
  className?: string;
}

const columnOptions = [
  { id: "documentNumber", label: "Document #" },
  { id: "title", label: "Title" },
  { id: "category", label: "Category" },
  { id: "status", label: "Status" },
  { id: "owner", label: "Owner" },
  { id: "date", label: "Date" },
  { id: "ocrStatus", label: "OCR Status" },
] as const;

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ocrFilter, setOcrFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columnOptions.map((column) => column.id),
  );

  const filterOptions = useMemo(
    () => ({
      categories: Array.from(new Set(data.map((d) => d.category))).sort(),
      statuses: Array.from(new Set(data.map((d) => d.status))).sort(),
      ocrStatuses: Array.from(new Set(data.map((d) => d.ocrStatus))).sort(),
    }),
    [data],
  );

  const filteredData = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((d) => {
      const matchesSearch =
        !q ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (categoryFilter === "all" || d.category === categoryFilter) &&
        (statusFilter === "all" || d.status === statusFilter) &&
        (ocrFilter === "all" || d.ocrStatus === ocrFilter)
      );
    });
  }, [categoryFilter, data, ocrFilter, search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(page * pageSize, (page + 1) * pageSize);

  const baseColumns: ColumnDef<RecentDocument, unknown>[] = [
    {
      id: "documentNumber",
      accessorKey: "documentNumber",
      header: "Document #",
      size: 140,
      cell: ({ row }) => (
        <span className="font-medium text-primary">{row.original.documentNumber}</span>
      ),
    },
    {
      id: "title",
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
      id: "category",
      accessorKey: "category",
      header: "Category",
      size: 110,
      cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ row }) => <StatusBadge status={row.original.status as StatusType} />,
    },
    {
      id: "owner",
      accessorKey: "owner",
      header: "Owner",
      size: 130,
    },
    {
      id: "date",
      accessorKey: "date",
      header: "Date",
      size: 100,
    },
    {
      id: "ocrStatus",
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()} />}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem render={<Link href={`/documents/${row.original.id}`} />}>
              <Eye className="h-3 w-3" />
              <span className="text-xs">View</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const columns = baseColumns.filter(
    (column) => column.id === "actions" || (column.id ? visibleColumns.includes(column.id) : true),
  );

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
              <div className="absolute top-full left-0 z-20 mt-1 w-56 space-y-2 rounded-lg border bg-popover p-3 shadow-[var(--shadow-popover)]">
                <FilterSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={(value) => {
                    setCategoryFilter(value);
                    setPage(0);
                  }}
                  options={filterOptions.categories}
                />
                <FilterSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(0);
                  }}
                  options={filterOptions.statuses}
                />
                <FilterSelect
                  label="OCR"
                  value={ocrFilter}
                  onChange={(value) => {
                    setOcrFilter(value);
                    setPage(0);
                  }}
                  options={filterOptions.ocrStatuses}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setOcrFilter("all");
                  }}
                >
                  Clear filters
                </Button>
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
              <div className="absolute top-full left-0 z-20 mt-1 w-48 space-y-1 rounded-lg border bg-popover p-3 shadow-[var(--shadow-popover)]">
                {columnOptions.map((column) => (
                  <label key={column.id} className="flex items-center gap-2 text-[var(--text-xs)]">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(column.id)}
                      onChange={(event) => {
                        setVisibleColumns((current) =>
                          event.target.checked
                            ? [...current, column.id]
                            : current.filter((id) => id !== column.id),
                        );
                      }}
                    />
                    {column.label}
                  </label>
                ))}
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
          <Button variant="outline" size="icon-sm" onClick={() => window.location.reload()}>
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
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[var(--text-xs)] font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 rounded-md border bg-background px-2 text-[var(--text-xs)] font-normal"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
