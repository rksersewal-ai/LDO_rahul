"use client";

import { ArrowLeft, Wrench } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { trpc } from "@/lib/trpc/client";

function mapWorkStatus(status: string): StatusType {
  switch (status) {
    case "completed":
      return "done";
    case "in_progress":
      return "in_process";
    case "open":
      return "pending";
    case "on_hold":
      return "blocked";
    case "cancelled":
      return "failed";
    default:
      return "pending";
  }
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

export default function PlWorkRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 25;

  const { data: pl } = trpc.pl.getById.useQuery({ id });
  const { data, isLoading, error } = trpc.pl.getWorkRecords.useQuery({
    plId: id,
    page,
    pageSize,
    status: statusFilter || undefined,
  });

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href={`/pl/${id}`} />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to {pl?.plNumber ?? "PL Detail"}
        </Button>

        <PageHeader
          title="Work Records"
          subtitle={pl ? `Work records for ${pl.plNumber} - ${pl.name}` : "Loading..."}
        />

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val ?? ""); setPage(1); }}>
            <SelectTrigger size="sm" className="w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data && (
            <p className="text-xs text-muted-foreground">
              {data.totalCount} record{data.totalCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {isLoading ? (
          <LoadingState variant="table" rows={8} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load work records: {error.message}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-5 w-5" />}
            title="No work records"
            description="Work records referencing this PL number will appear here."
          />
        ) : (
          <>
            <div className="rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Work Order #
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Workshop
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((record) => (
                    <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono font-medium">{record.workOrderNumber}</td>
                      <td className="px-3 py-2 truncate max-w-[250px]">{record.title}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={mapWorkStatus(record.status)}
                          label={record.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {record.priority}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{record.workshop}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
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
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageFrame>
  );
}
