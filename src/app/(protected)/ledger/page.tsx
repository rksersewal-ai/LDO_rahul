"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { WorkRecordDetail } from "@/components/ledger/work-record-detail";
import { WorkRecordForm } from "@/components/ledger/work-record-form";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { WORK_CATEGORIES } from "@/lib/mock-data/work-categories";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBMITTED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function WorkLedgerPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: workData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.work.list.useQuery(
    {
      search: search || undefined,
      status:
        statusFilter !== "all"
          ? (statusFilter as "OPEN" | "CLOSED" | "SUBMITTED" | "VERIFIED")
          : undefined,
      priority:
        priorityFilter !== "all"
          ? (priorityFilter as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
          : undefined,
      limit: 200,
    },
    { staleTime: 15_000 },
  );

  const { data: kpiData } = trpc.work.getKPIs.useQuery({}, { staleTime: 30_000 });

  const records = workData?.data ?? [];
  const totalRecords = workData?.total ?? 0;

  const filteredRecords = useMemo(() => {
    if (categoryFilter === "all") return records;
    // Filter by section field which maps to work category in the DB
    return records.filter((r: Record<string, unknown>) => {
      const section = (r.section as string) ?? "";
      return (
        section.toUpperCase() === categoryFilter.toUpperCase() ||
        section.toUpperCase().startsWith(categoryFilter.toUpperCase())
      );
    });
  }, [records, categoryFilter]);

  // KPI calculations from real data
  const kpis = useMemo(() => {
    return {
      total: kpiData?.total ?? 0,
      onTime: kpiData?.completed ?? 0,
      atRisk: kpiData?.onHold ?? 0,
      overdue: kpiData?.open ?? 0,
      onTimePercent: kpiData?.total
        ? Math.round(((kpiData?.completed ?? 0) / kpiData.total) * 100)
        : 0,
    };
  }, [kpiData]);

  function handleRecordClick(record: Record<string, unknown>) {
    setSelectedRecord(record);
    setDetailOpen(true);
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Work Ledger"
          subtitle="Daily work record tracking with disposal compliance"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
                Refresh
              </Button>
              <ExportDropdown
                title="Work Ledger"
                headers={[
                  "Date",
                  "Category",
                  "Type",
                  "Description",
                  "PL Number",
                  "Status",
                  "Days/Target",
                  "Priority",
                ]}
                rows={filteredRecords.map((r: Record<string, unknown>) => [
                  r.createdAt ? new Date(r.createdAt as string).toLocaleDateString("en-IN") : "-",
                  (r.title as string) ?? "-",
                  (r.workOrderNumber as string) ?? "-",
                  (r.description as string) ?? "-",
                  "-",
                  (r.status as string) ?? "-",
                  "-",
                  (r.priority as string) ?? "-",
                ])}
                filenamePrefix="work-ledger"
              />
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger render={<Button size="sm" className="h-7 text-xs gap-1" />}>
                  <Plus className="h-3 w-3" />
                  New Record
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Work Record</DialogTitle>
                    <DialogDescription>
                      Add a new daily work record entry with full details
                    </DialogDescription>
                  </DialogHeader>
                  <WorkRecordForm
                    onSubmit={() => {
                      setCreateOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Records</p>
                  <p className="text-lg font-bold">{kpis.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">On-Time %</p>
                  <p className="text-lg font-bold text-emerald-600">{kpis.onTimePercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">At-Risk</p>
                  <p className="text-lg font-bold text-amber-600">{kpis.atRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Overdue</p>
                  <p className="text-lg font-bold text-red-600">{kpis.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {WORK_CATEGORIES.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `Showing ${filteredRecords.length} of ${totalRecords} records`}
          </p>
        </div>

        {/* Error State */}
        {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

        {/* Data Table */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] w-[90px]">Date</TableHead>
                <TableHead className="text-[10px] w-[100px]">Work Order</TableHead>
                <TableHead className="text-[10px]">Title</TableHead>
                <TableHead className="text-[10px]">Description</TableHead>
                <TableHead className="text-[10px] w-[80px]">Status</TableHead>
                <TableHead className="text-[10px] w-[70px]">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                    Loading work records...
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredRecords.map((record: Record<string, unknown>) => (
                    <TableRow
                      key={record.id as string}
                      className="cursor-pointer"
                      onClick={() => handleRecordClick(record)}
                    >
                      <TableCell className="text-xs font-mono">
                        {record.createdAt
                          ? new Date(record.createdAt as string).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {(record.workOrderNumber as string) ?? "-"}
                      </TableCell>
                      <TableCell
                        className="text-xs max-w-[200px] truncate"
                        title={record.title as string}
                      >
                        {(record.title as string) ?? "-"}
                      </TableCell>
                      <TableCell
                        className="text-xs max-w-[250px] truncate"
                        title={record.description as string}
                      >
                        {(record.description as string) ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px]",
                            statusColors[(record.status as string)?.toUpperCase() ?? ""] ?? "",
                          )}
                        >
                          {(record.status as string) ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[10px]",
                            priorityColors[(record.priority as string)?.toUpperCase() ?? ""] ?? "",
                          )}
                        >
                          {(record.priority as string) ?? "-"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-xs text-muted-foreground"
                      >
                        No work records found matching the filters.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Sheet */}
      <WorkRecordDetail
        record={selectedRecord as never}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isSupervisor={true}
        onSubmit={() => setDetailOpen(false)}
        onVerify={() => setDetailOpen(false)}
        onReject={() => setDetailOpen(false)}
        onLock={() => setDetailOpen(false)}
      />
    </PageFrame>
  );
}
