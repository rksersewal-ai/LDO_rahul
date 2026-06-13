"use client";

import { Archive, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default function RecordsRetentionPage() {
  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Records & Retention"
          subtitle="Disposition review and the no-hard-delete removed-file registry"
        />
        <DispositionReviewSection />
        <RemovedFilesSection />
      </div>
    </PageFrame>
  );
}

function DispositionReviewSection() {
  const utils = trpc.useUtils();
  const { data, isLoading, isError, error, refetch } =
    trpc.governance.getDispositionReviewQueue.useQuery();

  const approve = trpc.governance.approveDestruction.useMutation({
    onSuccess: () => {
      toast.success("Destruction approved");
      utils.governance.getDispositionReviewQueue.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const execute = trpc.governance.executeDestruction.useMutation({
    onSuccess: () => {
      toast.success("Record disposed (file retained per no-hard-delete policy)");
      utils.governance.getDispositionReviewQueue.invalidate();
      utils.governance.getRemovedHashStats.invalidate();
      utils.governance.getRemovedHashes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Disposition Review Queue
        </h2>
        <Badge variant="outline" className="text-[10px] h-5">
          {data?.length ?? 0} expired
        </Badge>
      </div>

      {isLoading && <LoadingState variant="table" rows={4} columns={5} />}
      {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <p className="rounded-lg border bg-card p-6 text-center text-xs text-muted-foreground">
          No records have reached the end of their retention period.
        </p>
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Document</TableHead>
                <TableHead className="text-[11px]">Retention</TableHead>
                <TableHead className="text-[11px]">Expired</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{row.documentTitle ?? row.documentId}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {row.documentNumber ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{row.retentionPeriodYears}y</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.retentionExpiresAt).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    {row.approved ? (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4">
                        Pending approval
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!row.approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] gap-1"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate({ recordDeclarationId: row.id })}
                        >
                          <Archive className="h-3 w-3" />
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 text-[11px] gap-1"
                        disabled={!row.approved || execute.isPending}
                        title={
                          row.approved
                            ? "Logically dispose: soft-delete + flag hash. File is retained."
                            : "Approve first"
                        }
                        onClick={() => execute.mutate({ recordDeclarationId: row.id })}
                      >
                        <Trash2 className="h-3 w-3" />
                        Dispose
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function RemovedFilesSection() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: stats } = trpc.governance.getRemovedHashStats.useQuery();
  const { data, isLoading, isError, error, refetch } = trpc.governance.getRemovedHashes.useQuery({
    page,
    pageSize,
    includeRestored: false,
  });

  const restore = trpc.governance.restoreRemovedHash.useMutation({
    onSuccess: () => {
      toast.success("File hash restored — content is available again");
      utils.governance.getRemovedHashes.invalidate();
      utils.governance.getRemovedHashStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Removed Files (No Hard Delete)
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Flagged removed" value={stats?.removed ?? 0} />
        <StatCard label="Restored" value={stats?.restored ?? 0} />
        <StatCard label="Registry total" value={stats?.total ?? 0} />
        <StatCard label="Retained on disk" value={formatBytes(stats?.retainedBytes ?? 0)} />
      </div>

      <p className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldAlert className="h-3 w-3" />
        Files are never physically deleted. Hashes below are logically removed and fully restorable.
      </p>

      {isLoading && <LoadingState variant="table" rows={5} columns={5} />}
      {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

      {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
        <p className="rounded-lg border bg-card p-6 text-center text-xs text-muted-foreground">
          No removed file hashes in this workspace.
        </p>
      )}

      {!isLoading && !isError && (data?.items.length ?? 0) > 0 && (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">File Hash</TableHead>
                  <TableHead className="text-[11px]">Reason</TableHead>
                  <TableHead className="text-[11px]">Removed</TableHead>
                  <TableHead className="text-[11px]">Refs / Hold</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">
                      {row.fileHash.slice(0, 16)}…
                    </TableCell>
                    <TableCell className="text-xs">{row.reason ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.removedAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {row.activeReferences} refs
                        </Badge>
                        {row.underLegalHold && (
                          <Badge variant="destructive" className="text-[10px] h-4">
                            Legal hold
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] gap-1"
                        disabled={restore.isPending}
                        onClick={() => restore.mutate({ fileHash: row.fileHash })}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px]"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px]"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
