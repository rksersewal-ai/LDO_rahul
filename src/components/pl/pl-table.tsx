"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Eye, FileText, Flag, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface PlRow {
  id: string;
  plNumber: string;
  name: string;
  description: string | null;
  category: "CAT-A" | "CAT-B" | "CAT-C" | "CAT-D";
  status: "active" | "inactive" | "deprecated" | "under_review" | "obsolete";
  safetyCritical: boolean;
  drawingRef: string | null;
  specification: string | null;
  unit: string | null;
  workshop: string | null;
  manufacturer: string | null;
  vendorCode: string | null;
  partFamily: string | null;
  lifecycleStage: "draft" | "active" | "restricted" | "obsolete" | "deprecated" | null;
  lastUsedAt: Date | string | null;
  metadataJson: string | null;
  searchVector: string | null;
  workspaceId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

type PlCategory = "CAT-A" | "CAT-B" | "CAT-C" | "CAT-D";

function getCategoryBadgeClass(category: PlCategory): string {
  switch (category) {
    case "CAT-A":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "CAT-B":
      return "bg-warning/10 text-warning border-warning/20";
    case "CAT-C":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
    case "CAT-D":
      return "bg-success/10 text-success border-success/20";
  }
}

function mapPlStatus(status: string): StatusType {
  switch (status) {
    case "active":
      return "done";
    case "inactive":
      return "blocked";
    case "deprecated":
      return "failed";
    case "under_review":
      return "in_process";
    default:
      return "pending";
  }
}

const columns: ColumnDef<PlRow, unknown>[] = [
  {
    accessorKey: "plNumber",
    header: "PL Number",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">{row.original.plNumber}</span>
    ),
    size: 110,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="truncate text-xs font-medium max-w-[240px] block">{row.original.name}</span>
    ),
    size: 240,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;
      return (
        <Badge
          variant="outline"
          className={cn("text-[10px] font-semibold", getCategoryBadgeClass(category))}
        >
          {category}
        </Badge>
      );
    },
    size: 90,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <StatusBadge
          status={mapPlStatus(status)}
          label={status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        />
      );
    },
    size: 120,
  },
  {
    accessorKey: "lifecycleStage",
    header: "Lifecycle",
    cell: ({ row }) => {
      const stage = row.original.lifecycleStage;
      if (!stage) return <span className="text-xs text-muted-foreground">-</span>;
      return (
        <span className="text-xs capitalize text-muted-foreground">{stage.replace("_", " ")}</span>
      );
    },
    size: 100,
  },
  {
    accessorKey: "safetyCritical",
    header: "Safety",
    cell: ({ row }) =>
      row.original.safetyCritical ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Flag className="h-3.5 w-3.5 text-destructive fill-destructive/20" />
          </TooltipTrigger>
          <TooltipContent>
            <span>Safety Critical</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      ),
    size: 70,
  },
  {
    accessorKey: "workshop",
    header: "Workshop",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.workshop ?? "-"}</span>
    ),
    size: 140,
  },
  {
    id: "documents",
    header: "Docs",
    cell: () => (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="h-3 w-3" />
        <span>-</span>
      </span>
    ),
    size: 60,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            />
          }
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem render={<Link href={`/pl/${row.original.id}`} />}>
            <Eye className="h-3 w-3" />
            <span className="text-xs">View Details</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 40,
    enableSorting: false,
  },
];

interface PlTableProps {
  data: PlRow[];
  className?: string;
}

/** Threshold above which virtual scrolling is used for performance */
const VIRTUAL_SCROLL_THRESHOLD = 100;
const VIRTUAL_ROW_HEIGHT = 38;
const VIRTUAL_CONTAINER_HEIGHT = 600;

export function PlTable({ data, className }: PlTableProps) {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 10,
  });

  const useVirtual = data.length > VIRTUAL_SCROLL_THRESHOLD;

  if (useVirtual) {
    return (
      <div className={className}>
        <div
          ref={parentRef}
          className="overflow-auto rounded-md border"
          style={{ height: `${VIRTUAL_CONTAINER_HEIGHT}px` }}
        >
          {/* Table header */}
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr className="border-b">
                <th className="px-2 py-1.5 text-left font-medium w-[110px]">PL Number</th>
                <th className="px-2 py-1.5 text-left font-medium w-[240px]">Name</th>
                <th className="px-2 py-1.5 text-left font-medium w-[90px]">Category</th>
                <th className="px-2 py-1.5 text-left font-medium w-[120px]">Status</th>
                <th className="px-2 py-1.5 text-left font-medium w-[70px]">Safety</th>
                <th className="px-2 py-1.5 text-left font-medium w-[140px]">Workshop</th>
              </tr>
            </thead>
          </table>
          {/* Virtualized body */}
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 w-full flex items-center border-b cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{
                    top: 0,
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => router.push(`/pl/${row.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/pl/${row.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="px-2 font-mono text-xs font-medium w-[110px] truncate">
                    {row.plNumber}
                  </span>
                  <span className="px-2 text-xs font-medium w-[240px] truncate">{row.name}</span>
                  <span className="px-2 w-[90px]">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold",
                        getCategoryBadgeClass(row.category),
                      )}
                    >
                      {row.category}
                    </Badge>
                  </span>
                  <span className="px-2 w-[120px]">
                    <StatusBadge
                      status={mapPlStatus(row.status)}
                      label={row.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    />
                  </span>
                  <span className="px-2 w-[70px]">
                    {row.safetyCritical ? (
                      <Flag className="h-3.5 w-3.5 text-destructive fill-destructive/20" />
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </span>
                  <span className="px-2 text-xs text-muted-foreground w-[140px] truncate">
                    {row.workshop ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Showing {data.length} items (virtual scrolling enabled)
        </p>
      </div>
    );
  }

  return (
    <div
      className={className}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const row = target.closest("tr[data-state]") || target.closest("tbody tr");
        if (row) {
          const rowIndex = Array.from(row.parentElement?.children ?? []).indexOf(row);
          if (rowIndex >= 0 && data[rowIndex]) {
            router.push(`/pl/${data[rowIndex].id}`);
          }
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;
          const row = target.closest("tr");
          if (row) {
            const rowIndex = Array.from(row.parentElement?.children ?? []).indexOf(row);
            if (rowIndex >= 0 && data[rowIndex]) {
              router.push(`/pl/${data[rowIndex].id}`);
            }
          }
        }
      }}
    >
      <DataTable columns={columns} data={data} className="[&_tbody_tr]:cursor-pointer" />
    </div>
  );
}
