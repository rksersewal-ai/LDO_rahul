"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { WorkKpiBadge } from "@/components/ledger/work-kpi-badge";
import { WorkRecordDetail } from "@/components/ledger/work-record-detail";
import { WorkRecordForm } from "@/components/ledger/work-record-form";
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
import { MOCK_WORK_RECORDS, type MockWorkRecord } from "@/lib/mock-data/work-records";
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
  const [selectedRecord, setSelectedRecord] = useState<MockWorkRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    return MOCK_WORK_RECORDS.filter((record) => {
      if (
        search &&
        !record.description.toLowerCase().includes(search.toLowerCase()) &&
        !record.referenceNumber.toLowerCase().includes(search.toLowerCase()) &&
        !record.workTypeCode.toLowerCase().includes(search.toLowerCase()) &&
        !record.workTypeLabel.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (categoryFilter !== "all" && record.workCategory !== categoryFilter) return false;
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (priorityFilter !== "all" && record.priority !== priorityFilter) return false;
      return true;
    });
  }, [search, categoryFilter, statusFilter, priorityFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = MOCK_WORK_RECORDS.length;
    const onTime = MOCK_WORK_RECORDS.filter((r) => r.daysTaken <= r.targetDays).length;
    const atRisk = MOCK_WORK_RECORDS.filter(
      (r) => r.daysTaken > r.targetDays * 0.75 && r.daysTaken <= r.targetDays,
    ).length;
    const overdue = MOCK_WORK_RECORDS.filter((r) => r.daysTaken > r.targetDays).length;
    const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0;
    return { total, onTime, atRisk, overdue, onTimePercent };
  }, []);

  function handleRecordClick(record: MockWorkRecord) {
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
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" />
                Export
              </Button>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger render={<Button size="sm" className="h-7 text-xs gap-1" />}>
                  <Plus className="h-3 w-3" />
                  New Record
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Work Record</DialogTitle>
                    <DialogDescription>Add a new daily work record entry</DialogDescription>
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
            Showing {filteredRecords.length} of {MOCK_WORK_RECORDS.length} records
          </p>
        </div>

        {/* Data Table */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] w-[90px]">Date</TableHead>
                <TableHead className="text-[10px] w-[80px]">Category</TableHead>
                <TableHead className="text-[10px] w-[80px]">Type Code</TableHead>
                <TableHead className="text-[10px]">Description</TableHead>
                <TableHead className="text-[10px] w-[90px]">PL Number</TableHead>
                <TableHead className="text-[10px] w-[80px]">Status</TableHead>
                <TableHead className="text-[10px] w-[85px]">Days/Target</TableHead>
                <TableHead className="text-[10px] w-[70px]">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer"
                  onClick={() => handleRecordClick(record)}
                >
                  <TableCell className="text-xs font-mono">{record.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {record.workCategory}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{record.workTypeCode}</TableCell>
                  <TableCell className="text-xs max-w-[250px] truncate" title={record.description}>
                    {record.description}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{record.plNumber || "-"}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px]", statusColors[record.status])}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <WorkKpiBadge daysTaken={record.daysTaken} targetDays={record.targetDays} />
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px]", priorityColors[record.priority])}>
                      {record.priority}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                    No work records found matching the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Sheet */}
      <WorkRecordDetail
        record={selectedRecord}
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
