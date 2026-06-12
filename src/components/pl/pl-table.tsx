"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Flag, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
        <span className="text-xs capitalize text-muted-foreground">
          {stage.replace("_", " ")}
        </span>
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
    cell: () => (
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </Button>
    ),
    size: 40,
    enableSorting: false,
  },
];

interface PlTableProps {
  data: PlRow[];
  className?: string;
}

export function PlTable({ data, className }: PlTableProps) {
  const router = useRouter();

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
