"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface KpiDrillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricId: string | null;
  metricTitle: string;
}

type DrillDownRow = Record<string, unknown>;

function getColumnsForMetric(metricId: string): ColumnDef<DrillDownRow, unknown>[] {
  switch (metricId) {
    case "total_documents":
      return [
        {
          accessorKey: "documentNumber",
          header: "Document #",
          size: 130,
          cell: ({ row }) => (
            <span className="font-medium text-primary">
              {row.original.documentNumber as string}
            </span>
          ),
        },
        {
          accessorKey: "title",
          header: "Title",
          size: 240,
          cell: ({ row }) => (
            <span className="truncate block max-w-[240px]" title={row.original.title as string}>
              {row.original.title as string}
            </span>
          ),
        },
        {
          accessorKey: "category",
          header: "Category",
          size: 120,
          cell: ({ row }) => <Badge variant="secondary">{row.original.category as string}</Badge>,
        },
        {
          accessorKey: "status",
          header: "Status",
          size: 100,
          cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
              {(row.original.status as string).replace(/_/g, " ")}
            </Badge>
          ),
        },
        {
          accessorKey: "createdAt",
          header: "Date",
          size: 100,
          cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
              {new Date(row.original.createdAt as string).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ),
        },
      ];

    case "pending_approvals":
      return [
        {
          accessorKey: "documentNumber",
          header: "Document #",
          size: 130,
          cell: ({ row }) => (
            <span className="font-medium text-primary">
              {row.original.documentNumber as string}
            </span>
          ),
        },
        {
          accessorKey: "title",
          header: "Title",
          size: 220,
          cell: ({ row }) => (
            <span className="truncate block max-w-[220px]" title={row.original.title as string}>
              {row.original.title as string}
            </span>
          ),
        },
        {
          accessorKey: "requestedBy",
          header: "Requester",
          size: 130,
        },
        {
          accessorKey: "level",
          header: "Level",
          size: 90,
          cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
              {row.original.level as string}
            </Badge>
          ),
        },
        {
          accessorKey: "createdAt",
          header: "Submitted",
          size: 100,
          cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
              {new Date(row.original.createdAt as string).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ),
        },
      ];

    case "ocr_queue":
      return [
        {
          accessorKey: "documentNumber",
          header: "Document #",
          size: 140,
          cell: ({ row }) => (
            <span className="font-medium text-primary">
              {row.original.documentNumber as string}
            </span>
          ),
        },
        {
          accessorKey: "status",
          header: "Status",
          size: 110,
          cell: ({ row }) => (
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                (row.original.status as string) === "processing" && "border-blue-500 text-blue-600",
                (row.original.status as string) === "queued" && "border-amber-500 text-amber-600",
              )}
            >
              {row.original.status as string}
            </Badge>
          ),
        },
        {
          accessorKey: "engine",
          header: "Engine",
          size: 100,
        },
        {
          accessorKey: "createdAt",
          header: "Queued At",
          size: 120,
          cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
              {new Date(row.original.createdAt as string).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ),
        },
      ];

    case "open_cases":
      return [
        {
          accessorKey: "caseNumber",
          header: "Case #",
          size: 120,
          cell: ({ row }) => (
            <span className="font-medium text-primary">{row.original.caseNumber as string}</span>
          ),
        },
        {
          accessorKey: "title",
          header: "Title",
          size: 240,
          cell: ({ row }) => (
            <span className="truncate block max-w-[240px]" title={row.original.title as string}>
              {row.original.title as string}
            </span>
          ),
        },
        {
          accessorKey: "priority",
          header: "Priority",
          size: 90,
          cell: ({ row }) => {
            const p = row.original.priority as string;
            return (
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  p === "critical" && "border-red-500 text-red-600",
                  p === "high" && "border-orange-500 text-orange-600",
                  p === "medium" && "border-amber-500 text-amber-600",
                  p === "low" && "border-green-500 text-green-600",
                )}
              >
                {p}
              </Badge>
            );
          },
        },
        {
          accessorKey: "status",
          header: "Status",
          size: 110,
          cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
              {(row.original.status as string).replace(/_/g, " ")}
            </Badge>
          ),
        },
        {
          accessorKey: "createdAt",
          header: "Created",
          size: 100,
          cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
              {new Date(row.original.createdAt as string).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ),
        },
      ];

    case "pending_duplicates":
      return [
        {
          accessorKey: "documentNumber",
          header: "Document #",
          size: 140,
          cell: ({ row }) => (
            <span className="font-medium text-primary">
              {row.original.documentNumber as string}
            </span>
          ),
        },
        {
          accessorKey: "matchScore",
          header: "Match Score",
          size: 110,
          cell: ({ row }) => {
            const score = row.original.matchScore as number;
            return (
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  score >= 90 && "text-red-600",
                  score >= 70 && score < 90 && "text-amber-600",
                  score < 70 && "text-muted-foreground",
                )}
              >
                {score}%
              </span>
            );
          },
        },
        {
          accessorKey: "detectedAt",
          header: "Detected At",
          size: 120,
          cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
              {new Date(row.original.detectedAt as string).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ),
        },
      ];

    default:
      return [];
  }
}

function getExportHeaders(metricId: string): string[] {
  switch (metricId) {
    case "total_documents":
      return ["Document #", "Title", "Category", "Status", "Date"];
    case "pending_approvals":
      return ["Document #", "Title", "Requester", "Level", "Submitted"];
    case "ocr_queue":
      return ["Document #", "Status", "Engine", "Queued At"];
    case "open_cases":
      return ["Case #", "Title", "Priority", "Status", "Created"];
    case "pending_duplicates":
      return ["Document #", "Match Score", "Detected At"];
    default:
      return [];
  }
}

function getExportRows(metricId: string, items: DrillDownRow[]): Array<Array<string | number>> {
  switch (metricId) {
    case "total_documents":
      return items.map((r) => [
        r.documentNumber as string,
        r.title as string,
        r.category as string,
        r.status as string,
        new Date(r.createdAt as string).toLocaleDateString("en-IN"),
      ]);
    case "pending_approvals":
      return items.map((r) => [
        r.documentNumber as string,
        r.title as string,
        r.requestedBy as string,
        r.level as string,
        new Date(r.createdAt as string).toLocaleDateString("en-IN"),
      ]);
    case "ocr_queue":
      return items.map((r) => [
        r.documentNumber as string,
        r.status as string,
        r.engine as string,
        new Date(r.createdAt as string).toLocaleDateString("en-IN"),
      ]);
    case "open_cases":
      return items.map((r) => [
        r.caseNumber as string,
        r.title as string,
        r.priority as string,
        r.status as string,
        new Date(r.createdAt as string).toLocaleDateString("en-IN"),
      ]);
    case "pending_duplicates":
      return items.map((r) => [
        r.documentNumber as string,
        `${r.matchScore as number}%`,
        new Date(r.detectedAt as string).toLocaleDateString("en-IN"),
      ]);
    default:
      return [];
  }
}

export function KpiDrillModal({ open, onOpenChange, metricId, metricTitle }: KpiDrillModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Reset state when metric changes
  const effectiveMetricId = metricId ?? "";

  const { data, isLoading } = trpc.dashboard.getDrillDownData.useQuery(
    {
      metricId: effectiveMetricId,
      limit: pageSize,
      offset: page * pageSize,
      search: search || undefined,
    },
    {
      enabled: open && !!metricId,
      staleTime: 15_000,
    },
  );

  const items = (data?.items ?? []) as DrillDownRow[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = useMemo(() => getColumnsForMetric(effectiveMetricId), [effectiveMetricId]);

  const exportHeaders = getExportHeaders(effectiveMetricId);
  const exportRows = getExportRows(effectiveMetricId, items);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setSearch("");
          setPage(0);
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{metricTitle}</DialogTitle>
          <DialogDescription>
            Drill-down details - {total} record{total !== 1 ? "s" : ""} total
          </DialogDescription>
        </DialogHeader>

        {/* Search + Export toolbar */}
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="h-8 w-full rounded-md border bg-transparent pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <ExportDropdown
            title={metricTitle}
            headers={exportHeaders}
            rows={exportRows}
            filenamePrefix={`drill-${effectiveMetricId}`}
          />
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={items}
              showToolbar={false}
              showPagination={false}
              pageSize={pageSize}
            />
          )}
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t pt-2">
          <div className="text-xs text-muted-foreground tabular-nums">
            Showing {total > 0 ? page * pageSize + 1 : 0}-{Math.min((page + 1) * pageSize, total)}{" "}
            of {total}
          </div>
          <div className="flex items-center gap-3">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows/page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="h-6 rounded border bg-transparent px-1.5 text-xs focus:border-ring focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page info */}
            <span className="text-xs text-muted-foreground tabular-nums">
              Page {page + 1} of {totalPages}
            </span>

            {/* Nav buttons */}
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
      </DialogContent>
    </Dialog>
  );
}
