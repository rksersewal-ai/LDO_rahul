"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { CaseForm } from "@/components/cases/case-form";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CaseSeverity,
  type CaseStatus,
  type CaseType,
} from "@/lib/mock-data/cases";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { createCaseSchema } from "@/lib/validators/cases";

const severityColors: Record<CaseSeverity, string> = {
  LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusMap: Record<
  CaseStatus,
  { status: "done" | "in_process" | "pending" | "failed" | "blocked"; label: string }
> = {
  OPEN: { status: "pending", label: "Open" },
  IN_PROGRESS: { status: "in_process", label: "In Progress" },
  RESOLVED: { status: "done", label: "Resolved" },
  CLOSED: { status: "done", label: "Closed" },
  ESCALATED: { status: "blocked", label: "Escalated" },
};

const typeLabels: Record<CaseType, string> = {
  failure_investigation: "Failure Investigation",
  discrepancy: "Discrepancy",
  vendor_issue: "Vendor Issue",
  design_deviation: "Design Deviation",
  safety_concern: "Safety Concern",
};

export default function CasesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: casesData, isLoading, isError, error, refetch } = trpc.cases.list.useQuery(
    {
      status: statusFilter !== "all" ? statusFilter as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ESCALATED" : undefined,
      severity: severityFilter !== "all" ? severityFilter as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" : undefined,
      type: typeFilter !== "all" ? typeFilter as "failure_investigation" | "discrepancy" | "vendor_issue" | "design_deviation" | "safety_concern" : undefined,
      limit: 100,
    },
    { staleTime: 15_000 },
  );

  const createCase = trpc.cases.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
    },
  });

  const cases = casesData?.items ?? [];
  const totalCases = casesData?.total ?? 0;

  const handleStatusFilter = (value: string | null) => {
    setStatusFilter(value ?? "all");
  };
  const handleSeverityFilter = (value: string | null) => {
    setSeverityFilter(value ?? "all");
  };
  const handleTypeFilter = (value: string | null) => {
    setTypeFilter(value ?? "all");
  };

  const filteredCases = cases;

  const handleCreateCase = (data: z.infer<typeof createCaseSchema>) => {
    createCase.mutate(data);
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Cases"
          subtitle="Failure investigations, discrepancies, and vendor issues"
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button size="sm" className="h-7 text-xs gap-1" />}>
                <Plus className="h-3 w-3" />
                New Case
              </DialogTrigger>
              <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                  <DialogTitle className="text-base">Create New Case</DialogTitle>
                </DialogHeader>
                <CaseForm onSubmit={handleCreateCase} onCancel={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Status
              </SelectItem>
              <SelectItem value="OPEN" className="text-xs">
                Open
              </SelectItem>
              <SelectItem value="IN_PROGRESS" className="text-xs">
                In Progress
              </SelectItem>
              <SelectItem value="RESOLVED" className="text-xs">
                Resolved
              </SelectItem>
              <SelectItem value="CLOSED" className="text-xs">
                Closed
              </SelectItem>
              <SelectItem value="ESCALATED" className="text-xs">
                Escalated
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={handleSeverityFilter}>
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Severity
              </SelectItem>
              <SelectItem value="LOW" className="text-xs">
                Low
              </SelectItem>
              <SelectItem value="MEDIUM" className="text-xs">
                Medium
              </SelectItem>
              <SelectItem value="HIGH" className="text-xs">
                High
              </SelectItem>
              <SelectItem value="CRITICAL" className="text-xs">
                Critical
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[160px] h-7 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Types
              </SelectItem>
              <SelectItem value="failure_investigation" className="text-xs">
                Failure Investigation
              </SelectItem>
              <SelectItem value="discrepancy" className="text-xs">
                Discrepancy
              </SelectItem>
              <SelectItem value="vendor_issue" className="text-xs">
                Vendor Issue
              </SelectItem>
              <SelectItem value="design_deviation" className="text-xs">
                Design Deviation
              </SelectItem>
              <SelectItem value="safety_concern" className="text-xs">
                Safety Concern
              </SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {isLoading ? "Loading..." : `${filteredCases.length} of ${totalCases} cases`}
          </span>
        </div>

        {/* Error State */}
        {isError && !isLoading && (
          <QueryErrorState error={error} retry={() => refetch()} />
        )}

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-[120px]">Case #</TableHead>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs w-[130px]">Type</TableHead>
                <TableHead className="text-xs w-[100px]">Status</TableHead>
                <TableHead className="text-xs w-[90px]">Severity</TableHead>
                <TableHead className="text-xs w-[140px]">Assignee</TableHead>
                <TableHead className="text-xs w-[100px]">PL Number</TableHead>
                <TableHead className="text-xs w-[90px]">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Loading cases...
                  </TableCell>
                </TableRow>
              ) : filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    No cases match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((c: Record<string, unknown>) => {
                  const status = (c.status as string) ?? "OPEN";
                  const statusInfo = statusMap[status as CaseStatus] ?? { status: "pending" as const, label: status };
                  const severity = (c.severity as string) ?? "MEDIUM";
                  const caseType = (c.type as string) ?? "failure_investigation";
                  return (
                    <TableRow key={c.id as string}>
                      <TableCell className="text-xs font-mono">{(c.caseNumber as string) ?? "-"}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[250px] truncate">
                        {(c.title as string) ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {typeLabels[caseType as CaseType] ?? caseType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            severityColors[severity as CaseSeverity] ?? "",
                          )}
                        >
                          {severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{(c.assigneeName as string) ?? "-"}</TableCell>
                      <TableCell className="text-xs font-mono">{(c.plNumber as string) || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.createdAt
                          ? new Date(c.createdAt as string).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageFrame>
  );
}
