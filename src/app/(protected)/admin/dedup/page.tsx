"use client";

import { Clock, Copy, GitMerge, Loader2, Play, Save, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
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

  // Scan settings state
  const [schedule, setSchedule] = useState("0 2 * * *");
  const [scanTypeOption, setScanTypeOption] = useState<"basic" | "advanced">("basic");
  const [enabled, setEnabled] = useState(false);
  const [batchSize, setBatchSize] = useState(500);
  const [runScanType, setRunScanType] = useState<"basic" | "advanced">("basic");

  const pendingQuery = trpc.dedup.getPendingDuplicates.useQuery({ page, pageSize });
  const confirmMutation = trpc.dedup.confirmDuplicate.useMutation({
    onSuccess: () => pendingQuery.refetch(),
  });
  const dismissMutation = trpc.dedup.dismissDetection.useMutation({
    onSuccess: () => pendingQuery.refetch(),
  });
  const scanMutation = trpc.dedup.triggerScan.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      historyQuery.refetch();
    },
  });
  const historyQuery = trpc.dedup.getScanHistory.useQuery();
  const settingsQuery = trpc.dedup.getScanSettings.useQuery();
  const updateSettingsMutation = trpc.dedup.updateScanSettings.useMutation({
    onSuccess: () => settingsQuery.refetch(),
  });

  // Sync settings from query
  useEffect(() => {
    if (settingsQuery.data) {
      setSchedule(settingsQuery.data.schedule);
      setScanTypeOption(settingsQuery.data.type);
      setEnabled(settingsQuery.data.enabled);
      setBatchSize(settingsQuery.data.batchSize);
    }
  }, [settingsQuery.data]);

  const items = pendingQuery.data?.items ?? [];
  const total = pendingQuery.data?.total ?? 0;
  const scanHistory = historyQuery.data ?? [];

  const handleKeepDoc = (detectionId: string, keepDocumentId: string) => {
    confirmMutation.mutate({ detectionId, keepDocumentId });
  };

  const handleDismiss = (detectionId: string) => {
    dismissMutation.mutate({ detectionId, note: "Dismissed from admin UI" });
  };

  const handleRunScan = () => {
    scanMutation.mutate({ scanType: runScanType });
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      schedule,
      type: scanTypeOption,
      enabled,
      batchSize,
    });
  };

  const getScheduleLabel = (cron: string) => {
    if (cron === "0 2 * * *") return "daily";
    if (cron === "0 2 * * 0") return "weekly";
    if (cron === "0 2 1 * *") return "monthly";
    return "custom";
  };

  const handleScheduleChange = (value: string) => {
    switch (value) {
      case "daily":
        setSchedule("0 2 * * *");
        break;
      case "weekly":
        setSchedule("0 2 * * 0");
        break;
      case "monthly":
        setSchedule("0 2 1 * *");
        break;
      default:
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="default" className="text-[10px]">
            Running
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="text-[10px]">
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-[10px]">
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
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
            </div>
          }
        />

        {/* Scan Settings Section */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Scan Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Schedule */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Schedule</label>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={getScheduleLabel(schedule)}
                onChange={(e) => handleScheduleChange(e.target.value)}
              >
                <option value="daily">Daily (2:00 AM)</option>
                <option value="weekly">Weekly (Sunday 2:00 AM)</option>
                <option value="monthly">Monthly (1st 2:00 AM)</option>
                <option value="custom">Custom</option>
              </select>
              {getScheduleLabel(schedule) === "custom" && (
                <input
                  type="text"
                  className="h-7 rounded-md border bg-background px-2 text-xs mt-1"
                  placeholder="Cron expression"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                />
              )}
            </div>

            {/* Scan Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Scan Type</label>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={scanTypeOption}
                onChange={(e) => setScanTypeOption(e.target.value as "basic" | "advanced")}
              >
                <option value="basic">Basic (Fast)</option>
                <option value="advanced">Advanced (Full)</option>
              </select>
            </div>

            {/* Batch Size */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Batch Size</label>
              <input
                type="number"
                className="h-8 rounded-md border bg-background px-2 text-xs"
                min={50}
                max={5000}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
              />
            </div>

            {/* Enable/Disable */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Scheduled Scan</label>
              <button
                type="button"
                className={`h-8 rounded-md border px-3 text-xs font-medium transition-colors ${
                  enabled
                    ? "bg-green-100 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-300"
                    : "bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-700 dark:text-red-300"
                }`}
                onClick={() => setEnabled(!enabled)}
              >
                {enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Run Now Section */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Run Scan Now</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-7 rounded-md border bg-background px-2 text-xs"
                value={runScanType}
                onChange={(e) => setRunScanType(e.target.value as "basic" | "advanced")}
              >
                <option value="basic">Basic Scan</option>
                <option value="advanced">Advanced Scan</option>
              </select>
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
                Run Now
              </Button>
            </div>
          </div>
          {scanMutation.isSuccess && (
            <div className="mt-3 rounded-lg border bg-green-50 dark:bg-green-950 p-3 text-sm">
              Scan job queued successfully (type: {scanMutation.data.scanType}).
            </div>
          )}
        </div>

        {/* Scan History Section */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Scan History</h3>
          </div>
          {historyQuery.isLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : scanHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No scan history available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px]">Type</TableHead>
                  <TableHead className="text-[11px]">Pairs Scored</TableHead>
                  <TableHead className="text-[11px]">Detections</TableHead>
                  <TableHead className="text-[11px]">Started</TableHead>
                  <TableHead className="text-[11px]">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanHistory.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>{getStatusBadge(scan.status)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {scan.scanType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{scan.pairsScored.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{scan.detectionsFound}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {scan.startedAt
                        ? new Date(scan.startedAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {scan.completedAt
                        ? new Date(scan.completedAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pending Detections */}
        {pendingQuery.isLoading && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading detections...</p>
          </div>
        )}

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
                      Detected:{" "}
                      {item.detectedAt
                        ? new Date(item.detectedAt).toLocaleDateString("en-IN")
                        : "N/A"}
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
              <p className="text-sm text-muted-foreground">
                No pending duplicate detections found.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Run Now&quot; to analyze documents for duplicates.
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
