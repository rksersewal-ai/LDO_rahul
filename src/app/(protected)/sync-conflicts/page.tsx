"use client";

import { Check, GitCompare, Loader2, RefreshCw, X } from "lucide-react";
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ConflictPayload {
  clientValue?: Record<string, unknown>;
  serverValue?: Record<string, unknown>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SyncConflictsPage() {
  const conflictsQuery = trpc.work.listConflicts.useQuery();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resolveMutation = trpc.work.resolveConflict.useMutation({
    onSuccess: () => conflictsQuery.refetch(),
  });

  const conflicts = conflictsQuery.data ?? [];

  const handleResolve = (id: string, resolution: "keep_client" | "keep_server") => {
    resolveMutation.mutate({ id, resolution });
  };

  const parsePayload = (payload: string | null): ConflictPayload => {
    if (!payload) return {};
    try {
      return JSON.parse(payload) as ConflictPayload;
    } catch {
      return {};
    }
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Sync Conflicts"
          subtitle="Resolve conflicts between local changes and server state"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                <GitCompare className="size-3 mr-1" />
                {conflicts.length} conflicts
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => conflictsQuery.refetch()}
                disabled={conflictsQuery.isRefetching}
              >
                {conflictsQuery.isRefetching ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5 mr-1.5" />
                )}
                Refresh
              </Button>
            </div>
          }
        />

        {conflictsQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading conflicts...</p>
          </div>
        )}

        {!conflictsQuery.isLoading && conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Check className="size-12 text-green-500 mb-3" />
            <h3 className="text-lg font-medium">No Conflicts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All records are in sync. No action needed.
            </p>
          </div>
        ) : (
          !conflictsQuery.isLoading && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Conflict Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => {
                    const isExpanded = expandedId === conflict.id;
                    const payload = parsePayload(conflict.conflictPayload);
                    const isResolving = resolveMutation.isPending && resolveMutation.variables?.id === conflict.id;

                    return (
                      <ConflictRow
                        key={conflict.id}
                        conflict={conflict}
                        isExpanded={isExpanded}
                        isResolving={isResolving}
                        payload={payload}
                        onToggle={() => setExpandedId(isExpanded ? null : conflict.id)}
                        onResolve={handleResolve}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </div>
    </PageFrame>
  );
}

// ─── Conflict Row ──────────────────────────────────────────────────────────────

function ConflictRow({
  conflict,
  isExpanded,
  isResolving,
  payload,
  onToggle,
  onResolve,
}: {
  conflict: { id: string; workOrderNumber: string; title: string; syncStatus: string; conflictPayload: string | null; updatedAt: Date | string | null };
  isExpanded: boolean;
  isResolving: boolean;
  payload: ConflictPayload;
  onToggle: () => void;
  onResolve: (id: string, resolution: "keep_client" | "keep_server") => void;
}) {
  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-accent/40"
        onClick={onToggle}
      >
        <TableCell className="font-mono text-xs">{conflict.workOrderNumber}</TableCell>
        <TableCell className="font-medium">{conflict.title}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {conflict.updatedAt ? new Date(conflict.updatedAt).toLocaleString() : "N/A"}
        </TableCell>
        <TableCell>
          <Badge variant="destructive" className="text-[10px]">
            Conflict
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={isResolving}
              onClick={(e) => {
                e.stopPropagation();
                onResolve(conflict.id, "keep_client");
              }}
            >
              <Check className="size-3.5 mr-1" />
              Keep Mine
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isResolving}
              onClick={(e) => {
                e.stopPropagation();
                onResolve(conflict.id, "keep_server");
              }}
            >
              <X className="size-3.5 mr-1" />
              Keep Server
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Your Value */}
              <div className="rounded-md border bg-background p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Your Value (Local)
                </h4>
                {payload.clientValue ? (
                  <pre className="text-xs whitespace-pre-wrap break-all">
                    {JSON.stringify(payload.clientValue, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No local payload</p>
                )}
              </div>

              {/* Server Value */}
              <div className="rounded-md border bg-background p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Server Value
                </h4>
                {payload.serverValue ? (
                  <pre className="text-xs whitespace-pre-wrap break-all">
                    {JSON.stringify(payload.serverValue, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No server payload</p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
