"use client";

import { Copy, Eye, GitMerge, Loader2, Play, X } from "lucide-react";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function DeduplicationPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const pendingQuery = trpc.dedup.getPendingDuplicates.useQuery({ page, pageSize });
  const confirmMutation = trpc.dedup.confirmDuplicate.useMutation({
    onSuccess: () => pendingQuery.refetch(),
  });
  const dismissMutation = trpc.dedup.dismissDetection.useMutation({
    onSuccess: () => pendingQuery.refetch(),
  });
  const scanMutation = trpc.dedup.triggerScan.useMutation({
    onSuccess: () => pendingQuery.refetch(),
  });

  const items = pendingQuery.data?.items ?? [];
  const total = pendingQuery.data?.total ?? 0;

  const handleKeepDoc = (detectionId: string, keepDocumentId: string) => {
    confirmMutation.mutate({ detectionId, keepDocumentId });
  };

  const handleDismiss = (detectionId: string) => {
    dismissMutation.mutate({ detectionId, note: "Dismissed from admin UI" });
  };

  const handleRunScan = () => {
    // triggerScan requires a workspaceId; we use a prompt-style approach
    // In practice the workspace is available from context; here we pass empty to trigger
    // the admin scan of their workspace. The scan uses the input workspaceId.
    const wsId = prompt("Enter workspace ID to scan:");
    if (wsId) {
      scanMutation.mutate({ workspaceId: wsId });
    }
  };

  const getMatchType = (item: (typeof items)[0]) => {
    if (item.hashMatch) return { variant: "destructive" as const, label: "Exact Hash" };
    if (item.docNumberMatch) return { variant: "default" as const, label: "Doc Number Match" };
    if (item.score >= 0.85) return { variant: "default" as const, label: "High Similarity" };
    return { variant: "secondary" as const, label: "Potential Match" };
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Deduplication"
          subtitle="Identify and manage duplicate documents based on file hash and metadata"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {total} pending
              </Badge>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleRunScan}
                disabled={scanMutation.isPending}
              >
                {scanMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                Run Scan
              </Button>
            </div>
          }
        />

        {scanMutation.isSuccess && (
          <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-3 text-sm">
            Scan complete: scored {scanMutation.data.totalPairsScored} pairs, found{" "}
            {scanMutation.data.newDetections} new detections.
          </div>
        )}

        {pendingQuery.isLoading && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading detections...</p>
          </div>
        )}

        {/* Duplicate Detections */}
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const badge = getMatchType(item);
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="rounded-lg border bg-card">
                {/* Detection Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedId(isExpanded ? null : item.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">
                          Score: {(item.score * 100).toFixed(1)}%
                        </p>
                        <Badge variant={badge.variant} className="text-[10px] h-4">
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.docANumber} vs {item.docBNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      Detected: {item.detectedAt ? new Date(item.detectedAt).toLocaleDateString("en-IN") : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px]">Document</TableHead>
                          <TableHead className="text-[11px]">Doc Number</TableHead>
                          <TableHead className="text-[11px]">Title</TableHead>
                          <TableHead className="text-[11px]">Category</TableHead>
                          <TableHead className="text-[11px]">File Hash</TableHead>
                          <TableHead className="text-[11px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-xs font-semibold">Doc A</TableCell>
                          <TableCell className="text-xs font-mono">{item.docANumber}</TableCell>
                          <TableCell className="text-xs">{item.docATitle}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.docACategory}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {item.docAFileHash ? `${item.docAFileHash.slice(0, 12)}...` : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-6 text-[10px] gap-0.5 px-1.5"
                              disabled={confirmMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeepDoc(item.id, item.documentAId);
                              }}
                            >
                              <GitMerge className="h-2.5 w-2.5" />
                              Keep Doc A
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs font-semibold">Doc B</TableCell>
                          <TableCell className="text-xs font-mono">{item.docBNumber}</TableCell>
                          <TableCell className="text-xs">{item.docBTitle}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.docBCategory}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {item.docBFileHash ? `${item.docBFileHash.slice(0, 12)}...` : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-6 text-[10px] gap-0.5 px-1.5"
                              disabled={confirmMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeepDoc(item.id, item.documentBId);
                              }}
                            >
                              <GitMerge className="h-2.5 w-2.5" />
                              Keep Doc B
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {/* Signal details */}
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                      <Badge variant="outline">
                        Title: {(item.titleSimilarity * 100).toFixed(0)}%
                      </Badge>
                      <Badge variant="outline">
                        OCR: {(item.ocrTextSimilarity * 100).toFixed(0)}%
                      </Badge>
                      <Badge variant="outline">
                        PL Overlap: {(item.plOverlap * 100).toFixed(0)}%
                      </Badge>
                      {item.hashMatch && <Badge variant="destructive">Hash Match</Badge>}
                      {item.docNumberMatch && <Badge variant="default">Doc# Match</Badge>}
                      {item.metaMatch && <Badge variant="secondary">Meta Match</Badge>}
                    </div>

                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={dismissMutation.isPending}
                        onClick={() => handleDismiss(item.id)}
                      >
                        <X className="h-3 w-3" />
                        Dismiss (Not Duplicate)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!pendingQuery.isLoading && items.length === 0 && (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No pending duplicate detections found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Run Scan&quot; to analyze documents for duplicates.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs self-center text-muted-foreground">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
