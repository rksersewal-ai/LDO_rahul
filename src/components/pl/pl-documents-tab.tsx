"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Link2, Plus, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type { MockDocument } from "@/lib/mock-data/documents";

interface PlDocumentsTabProps {
  documents: MockDocument[];
  plId: string;
}

function mapDocStatus(status: string): StatusType {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
      return "done";
    case "UNDER_REVIEW":
      return "in_process";
    case "DRAFT":
      return "pending";
    case "OBSOLETE":
      return "failed";
    default:
      return "pending";
  }
}

function mapOcrStatus(status: string): StatusType {
  switch (status) {
    case "COMPLETED":
      return "done";
    case "PROCESSING":
      return "in_process";
    case "PENDING":
      return "pending";
    case "FAILED":
    case "FLAGGED":
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
      <span className="font-mono text-xs font-medium">{row.original.documentNumber}</span>
    ),
    size: 130,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="truncate text-xs max-w-[200px] block">{row.original.title}</span>
    ),
    size: 200,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-[10px]">
        {row.original.category}
      </Badge>
    ),
    size: 120,
  },
  {
    accessorKey: "revision",
    header: "Rev",
    cell: ({ row }) => <span className="text-xs">{row.original.revision}</span>,
    size: 60,
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
    accessorKey: "ocrStatus",
    header: "OCR",
    cell: ({ row }) => (
      <StatusBadge status={mapOcrStatus(row.original.ocrStatus)} label={row.original.ocrStatus} />
    ),
    size: 110,
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Unlink document">
        <Unlink className="h-3 w-3 text-muted-foreground" />
      </Button>
    ),
    size: 40,
    enableSorting: false,
  },
];

export function PlDocumentsTab({ documents, plId: _plId }: PlDocumentsTabProps) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<Link2 className="h-5 w-5" />}
        title="No linked documents"
        description="Link documents to this PL number to track related engineering documentation."
        actionLabel="Link Document"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""} linked
        </p>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          Link Document
        </Button>
      </div>
      <DataTable columns={columns} data={documents} />
    </div>
  );
}
