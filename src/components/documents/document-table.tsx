"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
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
import type { DocumentCategory, MockDocument } from "@/lib/mock-data/documents";
import { cn } from "@/lib/utils";
import { OcrStatusBadge } from "./ocr-status-badge";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCategoryColor(category: DocumentCategory): string {
  switch (category) {
    case "DRAWING":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
    case "SPECIFICATION":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400";
    case "TEST_REPORT":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    case "CERTIFICATE":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    case "STANDARD":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400";
    case "TENDER":
      return "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400";
    case "SDR":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function mapDocStatus(status: string): StatusType {
  switch (status) {
    case "ACTIVE":
      return "done";
    case "DRAFT":
      return "pending";
    case "UNDER_REVIEW":
      return "in_process";
    case "APPROVED":
      return "done";
    case "OBSOLETE":
      return "failed";
    default:
      return "pending";
  }
}

const columns: ColumnDef<MockDocument, unknown>[] = [
  {
    accessorKey: "documentNumber",
    header: "Document #",
    cell: ({ row }) => (
      <Link
        href={`/documents/${row.original.id}`}
        className="font-mono text-[11px] font-medium text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.documentNumber}
      </Link>
    ),
    size: 160,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="truncate text-xs font-medium max-w-[260px] block">{row.original.title}</span>
    ),
    size: 260,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn("text-[9px] font-semibold", getCategoryColor(row.original.category))}
      >
        {row.original.category.replace("_", " ")}
      </Badge>
    ),
    size: 120,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={mapDocStatus(row.original.status)}
        label={row.original.status.replace("_", " ")}
      />
    ),
    size: 110,
  },
  {
    accessorKey: "revision",
    header: "Rev",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.revision}</span>
    ),
    size: 50,
  },
  {
    accessorKey: "agency",
    header: "Owner",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.agency}</span>,
    size: 70,
  },
  {
    accessorKey: "updatedAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
    ),
    size: 90,
  },
  {
    accessorKey: "ocrStatus",
    header: "OCR",
    cell: ({ row }) => (
      <OcrStatusBadge status={row.original.ocrStatus} confidence={row.original.ocrConfidence} />
    ),
    size: 110,
  },
  {
    accessorKey: "fileType",
    header: "Type",
    cell: ({ row }) => (
      <span className="uppercase text-[10px] font-medium text-muted-foreground">
        {row.original.fileType}
      </span>
    ),
    size: 50,
  },
  {
    accessorKey: "fileSize",
    header: "Size",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatFileSize(row.original.fileSize)}</span>
    ),
    size: 70,
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
          <DropdownMenuItem render={<Link href={`/documents/${row.original.id}`} />}>
            <Eye className="h-3 w-3" />
            <span className="text-xs">View</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <Download className="h-3 w-3" />
            <span className="text-xs">Download</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <Pencil className="h-3 w-3" />
            <span className="text-xs">Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-3 w-3" />
            <span className="text-xs">Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 40,
    enableSorting: false,
  },
];

interface DocumentTableProps {
  data: MockDocument[];
  className?: string;
}

export function DocumentTable({ data, className }: DocumentTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      enableSelection
      className={cn("[&_tbody_tr]:cursor-pointer", className)}
    />
  );
}
