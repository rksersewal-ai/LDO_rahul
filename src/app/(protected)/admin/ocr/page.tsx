"use client";

import { Ban, Loader2, Play, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type OcrJobStatus, type OcrQueueJob } from "@/lib/mock-data/admin";
import { trpc } from "@/lib/trpc/client";

const statusBadge: Record<
  OcrJobStatus,
  { variant: "default" | "secondary" | "outline" | "destructive"; label: string }
> = {
  queued: { variant: "outline", label: "Queued" },
  processing: { variant: "default", label: "Processing" },
  completed: { variant: "secondary", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
  cancelled: { variant: "outline", label: "Cancelled" },
};

export default function OcrMonitorPage() {
  const { data: ocrData, isLoading, refetch } = trpc.admin.getOcrQueue.useQuery(
    undefined,
    { staleTime: 15_000, refetchInterval: 30_000 },
  );
  const retryMutation = trpc.admin.retryOcrJob.useMutation({ onSuccess: () => refetch() });
  const cancelMutation = trpc.admin.cancelOcrJob.useMutation({ onSuccess: () => refetch() });

  const jobs = (ocrData?.jobs ?? []) as unknown as OcrQueueJob[];
  const [filter, setFilter] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const summary = ocrData?.summary ?? {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  const handleRetry = (id: string) => {
    retryMutation.mutate({ id });
  };

  const handleCancel = (id: string) => {
    cancelMutation.mutate({ id });
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="OCR Monitor"
          subtitle="Monitor OCR processing queue and manage jobs"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                Auto-refresh: {lastRefresh.toLocaleTimeString()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setLastRefresh(new Date())}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Queued" value={summary.queued} color="text-blue-600" />
          <SummaryCard label="Processing" value={summary.processing} color="text-amber-600" />
          <SummaryCard
            label="Completed (Today)"
            value={summary.completed}
            color="text-emerald-600"
          />
          <SummaryCard label="Failed" value={summary.failed} color="text-red-600" />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(val) => setFilter(val || "all")}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px] h-5 ml-auto">
            {filtered.length} jobs
          </Badge>
        </div>

        {/* Jobs Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Document</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Priority</TableHead>
                <TableHead className="text-[11px]">Progress</TableHead>
                <TableHead className="text-[11px]">Started</TableHead>
                <TableHead className="text-[11px]">Duration</TableHead>
                <TableHead className="text-[11px]">Error</TableHead>
                <TableHead className="text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => {
                const badge = statusBadge[job.status];
                const progress =
                  job.pagesTotal > 0 ? Math.round((job.pagesProcessed / job.pagesTotal) * 100) : 0;
                return (
                  <TableRow
                    key={job.id}
                    className={job.status === "failed" ? "bg-red-50/50 dark:bg-red-950/10" : ""}
                  >
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium truncate max-w-[200px]">
                          {job.documentNumber}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {job.documentTitle}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-[10px] h-4">
                        {job.status === "processing" && (
                          <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                        )}
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-4 capitalize ${
                          job.priority === "high" ? "border-red-300 text-red-700" : ""
                        }`}
                      >
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {job.pagesProcessed}/{job.pagesTotal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.startedAt
                        ? new Date(job.startedAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.duration
                        ? `${Math.floor(job.duration / 60)}m ${job.duration % 60}s`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {job.error ? (
                        <p
                          className="text-[10px] text-destructive truncate max-w-[150px]"
                          title={job.error}
                        >
                          {job.error}
                        </p>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(job.status === "failed" || job.status === "cancelled") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] gap-0.5 px-1.5"
                            onClick={() => handleRetry(job.id)}
                          >
                            <Play className="h-2.5 w-2.5" />
                            Retry
                          </Button>
                        )}
                        {(job.status === "queued" || job.status === "processing") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] gap-0.5 px-1.5 text-destructive"
                            onClick={() => handleCancel(job.id)}
                          >
                            <Ban className="h-2.5 w-2.5" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageFrame>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
