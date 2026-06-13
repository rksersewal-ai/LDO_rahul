"use client";

import { ChevronDown, ChevronRight, Download, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
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
import type { AuditAction, AuditLogEntry, ResourceType } from "@/lib/mock-data/admin";
import { trpc } from "@/lib/trpc/client";
import { exportToCSV } from "@/lib/utils/export-service";

const actionColors: Record<AuditAction, "default" | "secondary" | "outline" | "destructive"> = {
  LOGIN: "secondary",
  LOGOUT: "outline",
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  UPLOAD: "default",
  DOWNLOAD: "secondary",
  APPROVE: "default",
  REJECT: "destructive",
  OCR_START: "outline",
  OCR_COMPLETE: "secondary",
  SETTINGS_CHANGE: "default",
  USER_DEACTIVATE: "destructive",
  ROLE_CHANGE: "default",
  PASSWORD_RESET: "secondary",
};

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const {
    data: auditData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.admin.getAuditLog.useQuery(
    {
      search: search || undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      resourceType: resourceFilter !== "all" ? resourceFilter : undefined,
      limit: 100,
    },
    { staleTime: 15_000 },
  );

  // Real hash-chain integrity verification (replaces the previous static badge).
  const { data: chain, isLoading: chainLoading } = trpc.admin.verifyAuditChain.useQuery(undefined, {
    staleTime: 60_000,
  });

  const filtered = (auditData?.items ?? []).map((item: Record<string, unknown>) => ({
    id: (item.id as string) ?? "",
    timestamp: (item.createdAt as string) ?? new Date().toISOString(),
    userId: (item.userId as string) ?? "",
    userName: (item.userName as string) ?? "",
    action: ((item.action as string) ?? "CREATE") as AuditAction,
    resourceType: ((item.entityType as string) ?? "document") as ResourceType,
    resourceId: (item.entityId as string) ?? "",
    resourceTitle: (item.entityTitle as string) ?? "",
    ip: "",
    details: (item.details as string) ?? "",
    hashChain: (item.id as string) ?? "",
  })) as AuditLogEntry[];

  const actions: AuditAction[] = [
    "LOGIN",
    "LOGOUT",
    "CREATE",
    "UPDATE",
    "DELETE",
    "UPLOAD",
    "DOWNLOAD",
    "APPROVE",
    "REJECT",
    "OCR_START",
    "OCR_COMPLETE",
    "SETTINGS_CHANGE",
    "USER_DEACTIVATE",
    "ROLE_CHANGE",
    "PASSWORD_RESET",
  ];

  const resourceTypes: ResourceType[] = [
    "document",
    "pl_item",
    "work_record",
    "user",
    "case",
    "approval",
    "bom",
    "settings",
    "banner",
  ];

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Audit Log"
          subtitle="Complete system activity history with hash chain integrity"
          actions={
            <div className="flex items-center gap-2">
              <Badge
                variant={chain && !chain.valid ? "destructive" : "secondary"}
                className="text-[10px] h-5 gap-1"
                title={chain?.details ?? undefined}
              >
                <Shield className="h-2.5 w-2.5" />
                {chainLoading
                  ? "Hash Chain: Checking…"
                  : chain
                    ? chain.valid
                      ? "Hash Chain: Valid"
                      : `Hash Chain: BROKEN${typeof chain.brokenAt === "number" ? ` @ #${chain.brokenAt}` : ""}`
                    : "Hash Chain: Unknown"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  exportToCSV(
                    [
                      "Timestamp",
                      "User",
                      "Action",
                      "Resource Type",
                      "Resource ID",
                      "IP",
                      "Details",
                    ],
                    filtered.map(
                      (entry) =>
                        [
                          new Date(entry.timestamp).toLocaleString("en-IN"),
                          entry.userName,
                          entry.action,
                          entry.resourceType,
                          entry.resourceId,
                          entry.ip,
                          entry.details,
                        ] as (string | number)[],
                    ),
                    "audit-log",
                  );
                  toast.success(`Exported ${filtered.length} audit log entries to CSV`);
                }}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search audit log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs w-64"
          />
          <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={(val) => setResourceFilter(val || "all")}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {resourceTypes.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px] h-5 ml-auto">
            {filtered.length} entries
          </Badge>
        </div>

        {/* Error State */}
        {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

        {/* Audit Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] w-8" />
                <TableHead className="text-[11px]">Timestamp</TableHead>
                <TableHead className="text-[11px]">User</TableHead>
                <TableHead className="text-[11px]">Action</TableHead>
                <TableHead className="text-[11px]">Resource</TableHead>
                <TableHead className="text-[11px]">Resource ID</TableHead>
                <TableHead className="text-[11px]">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <AuditRow
                  key={entry.id}
                  entry={entry}
                  expanded={expandedRow === entry.id}
                  onToggle={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageFrame>
  );
}

function AuditRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-accent/50" onClick={onToggle}>
        <TableCell className="w-8 p-2">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(entry.timestamp).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </TableCell>
        <TableCell className="text-xs font-medium">{entry.userName}</TableCell>
        <TableCell>
          <Badge variant={actionColors[entry.action]} className="text-[10px] h-4">
            {entry.action.replace(/_/g, " ")}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-[10px] h-4 capitalize">
            {entry.resourceType.replace(/_/g, " ")}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground font-mono">
          {entry.resourceId}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground font-mono">{entry.ip}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={7} className="p-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-[11px] mb-1">Details</p>
                <p className="text-muted-foreground">{entry.details}</p>
              </div>
              <div>
                <p className="font-semibold text-[11px] mb-1">Hash Chain</p>
                <p className="text-muted-foreground font-mono text-[10px] break-all">
                  {entry.hashChain}
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
