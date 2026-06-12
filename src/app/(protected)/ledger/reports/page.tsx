"use client";

import { Download, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageFrame } from "@/components/layout/page-frame";
import { CategoryBreakdownChart } from "@/components/ledger/category-breakdown-chart";
import { DisposalChart, generateDisposalData } from "@/components/ledger/disposal-chart";
import { WorkKpiBadge } from "@/components/ledger/work-kpi-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MOCK_ADMIN_USERS } from "@/lib/mock-data/admin";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data/work-records";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export-csv";

type ViewMode = "overview" | "individual" | "comparative";

export default function LedgerReportsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as string) || "engineer";
  const isAdminOrSupervisor = userRole === "admin" || userRole === "supervisor";

  // For non-admin/supervisor users, default to a static mock userId
  const defaultUserId = isAdminOrSupervisor ? "all" : "user-001";

  const [selectedUserId, setSelectedUserId] = useState<string>(defaultUserId);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  // Non-admin users can only see Overview and Individual
  const availableViewModes: ViewMode[] = isAdminOrSupervisor
    ? ["overview", "individual", "comparative"]
    : ["overview", "individual"];

  // Filter records based on selected user and date range
  const filteredRecords = useMemo(() => {
    let records = [...MOCK_WORK_RECORDS];
    if (selectedUserId !== "all") {
      records = records.filter((r) => r.userId === selectedUserId);
    }
    if (dateFrom) {
      records = records.filter((r) => r.date >= dateFrom);
    }
    if (dateTo) {
      records = records.filter((r) => r.date <= dateTo);
    }
    return records;
  }, [selectedUserId, dateFrom, dateTo]);

  // Disposal data
  const disposalData = useMemo(() => generateDisposalData(), []);

  // Overdue items from filtered records
  const overdueItems = useMemo(() => {
    return filteredRecords
      .filter((r) => r.daysTaken > r.targetDays)
      .sort((a, b) => b.daysTaken - b.targetDays - (a.daysTaken - a.targetDays));
  }, [filteredRecords]);

  // User productivity data
  const productivityData = useMemo(() => {
    const userMap: Record<string, number> = {};
    for (const record of filteredRecords) {
      userMap[record.userName] = (userMap[record.userName] || 0) + 1;
    }
    return Object.entries(userMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const days: Record<string, { date: string; total: number; completed: number }> = {};
    for (const record of filteredRecords) {
      if (!days[record.date]) {
        days[record.date] = { date: record.date, total: 0, completed: 0 };
      }
      days[record.date].total += 1;
      if (record.status === "VERIFIED" || record.status === "CLOSED") {
        days[record.date].completed += 1;
      }
    }
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  // Per-user productivity stats for comparative view
  const userProductivityStats = useMemo(() => {
    let records = [...MOCK_WORK_RECORDS];
    if (dateFrom) {
      records = records.filter((r) => r.date >= dateFrom);
    }
    if (dateTo) {
      records = records.filter((r) => r.date <= dateTo);
    }

    const userMap: Record<
      string,
      {
        userId: string;
        userName: string;
        totalRecords: number;
        completedRecords: number;
        onTimeRecords: number;
        overdueRecords: number;
        totalDaysTaken: number;
      }
    > = {};

    for (const record of records) {
      if (!userMap[record.userId]) {
        userMap[record.userId] = {
          userId: record.userId,
          userName: record.userName,
          totalRecords: 0,
          completedRecords: 0,
          onTimeRecords: 0,
          overdueRecords: 0,
          totalDaysTaken: 0,
        };
      }
      const entry = userMap[record.userId];
      entry.totalRecords += 1;
      entry.totalDaysTaken += record.daysTaken;
      if (record.status === "VERIFIED" || record.status === "CLOSED") {
        entry.completedRecords += 1;
      }
      if (record.daysTaken <= record.targetDays) {
        entry.onTimeRecords += 1;
      }
      if (record.daysTaken > record.targetDays) {
        entry.overdueRecords += 1;
      }
    }

    return Object.values(userMap).map((u) => ({
      userId: u.userId,
      userName: u.userName,
      department:
        MOCK_ADMIN_USERS.find((au) => au.name === u.userName)?.department || "Engineering",
      totalRecords: u.totalRecords,
      completedRecords: u.completedRecords,
      onTimeRecords: u.onTimeRecords,
      overdueRecords: u.overdueRecords,
      avgDaysTaken: u.totalRecords > 0 ? Math.round(u.totalDaysTaken / u.totalRecords) : 0,
      onTimePercentage:
        u.totalRecords > 0 ? Math.round((u.onTimeRecords / u.totalRecords) * 100) : 0,
    }));
  }, [dateFrom, dateTo]);

  // Individual user stats for the selected user
  const individualStats = useMemo(() => {
    if (selectedUserId === "all") return null;
    const stats = userProductivityStats.find((u) => u.userId === selectedUserId);
    return stats || null;
  }, [selectedUserId, userProductivityStats]);

  // Selected user info
  const selectedUserInfo = useMemo(() => {
    if (selectedUserId === "all") return null;
    // Try to find the user in MOCK_ADMIN_USERS by matching userName from work records
    const workUser = MOCK_WORK_RECORDS.find((r) => r.userId === selectedUserId);
    if (!workUser) return null;
    const adminUser = MOCK_ADMIN_USERS.find((u) => u.name === workUser.userName);
    return {
      name: workUser.userName,
      department: adminUser?.department || "Engineering",
      role: adminUser?.role || "engineer",
      designation: adminUser?.designation || "SSE",
    };
  }, [selectedUserId]);

  // Export handler
  const handleExport = () => {
    if (viewMode === "overview") {
      const data = filteredRecords.map((r) => ({
        Date: r.date,
        Category: r.workCategory,
        Type: r.workTypeLabel,
        Description: r.description,
        User: r.userName,
        Priority: r.priority,
        Status: r.status,
        DaysTaken: r.daysTaken,
        TargetDays: r.targetDays,
      }));
      exportToCSV(data, "ledger-report-overview.csv");
    } else if (viewMode === "individual" && selectedUserId !== "all") {
      const data = filteredRecords.map((r) => ({
        Date: r.date,
        Category: r.workCategory,
        Description: r.description,
        Priority: r.priority,
        DaysTaken: r.daysTaken,
        TargetDays: r.targetDays,
        Status: r.status,
      }));
      exportToCSV(data, `ledger-report-${selectedUserId}.csv`);
    } else if (viewMode === "comparative") {
      const data = userProductivityStats.map((u) => ({
        UserName: u.userName,
        Department: u.department,
        TotalRecords: u.totalRecords,
        Completed: u.completedRecords,
        OnTimePercent: u.onTimePercentage,
        Overdue: u.overdueRecords,
        AvgDays: u.avgDaysTaken,
      }));
      exportToCSV(data, "ledger-report-comparative.csv");
    }
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Ledger Reports"
          subtitle="Work record analytics and disposal compliance reporting"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleExport}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            </div>
          }
        />

        {/* Filter Bar */}
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* User Dropdown - only for admin/supervisor */}
              {isAdminOrSupervisor && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select
                    value={selectedUserId}
                    onValueChange={(val) => setSelectedUserId(val || "all")}
                  >
                    <SelectTrigger className="h-8 text-xs w-44">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {MOCK_ADMIN_USERS.filter((u) => u.isActive).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                      {/* Also include work record users that might not be in admin users */}
                      {Array.from(
                        new Map(MOCK_WORK_RECORDS.map((r) => [r.userId, r.userName])).entries(),
                      )
                        .filter(([uid]) => !MOCK_ADMIN_USERS.some((u) => u.id === uid))
                        .map(([uid, name]) => (
                          <SelectItem key={uid} value={uid}>
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">From:</span>
                <Input
                  type="date"
                  className="h-8 text-xs w-36"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">To:</span>
                <Input
                  type="date"
                  className="h-8 text-xs w-36"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 ml-auto">
                {availableViewModes.map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-[10px] px-2.5 capitalize"
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Mode */}
        {viewMode === "overview" && (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DisposalChart data={disposalData} />
              <CategoryBreakdownChart records={filteredRecords} />
            </div>

            {/* User Productivity + Monthly Trend */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* User Productivity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[var(--text-sm)] font-semibold">
                    User Productivity
                  </CardTitle>
                  <p className="text-[var(--text-xs)] text-muted-foreground">
                    Records per engineer this period
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productivityData}
                        layout="vertical"
                        margin={{ top: 4, right: 20, bottom: 0, left: 80 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          width={75}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value) => [`${value} records`, "Count"]}
                        />
                        <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[var(--text-sm)] font-semibold">
                    Daily Activity Trend
                  </CardTitle>
                  <p className="text-[var(--text-xs)] text-muted-foreground">
                    Records created vs completed by day
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyTrend}
                        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="var(--chart-1)"
                          strokeWidth={2}
                          dot={false}
                          name="Created"
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="var(--chart-3)"
                          strokeWidth={2}
                          dot={false}
                          name="Completed"
                          strokeDasharray="4 2"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overdue Items Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[var(--text-sm)] font-semibold text-red-600">
                  Overdue Items
                </CardTitle>
                <p className="text-[var(--text-xs)] text-muted-foreground">
                  Work records exceeding their disposal day targets
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px]">Date</TableHead>
                        <TableHead className="text-[10px]">Category</TableHead>
                        <TableHead className="text-[10px]">Type Code</TableHead>
                        <TableHead className="text-[10px]">Description</TableHead>
                        <TableHead className="text-[10px]">Owner</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px]">Days/Target</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-16 text-center text-xs text-muted-foreground"
                          >
                            No overdue items - great performance!
                          </TableCell>
                        </TableRow>
                      ) : (
                        overdueItems.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-xs font-mono">{record.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {record.workCategory}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {record.workTypeCode}
                            </TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">
                              {record.description}
                            </TableCell>
                            <TableCell className="text-xs">{record.userName}</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "text-[10px]",
                                  record.status === "OPEN"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800",
                                )}
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <WorkKpiBadge
                                daysTaken={record.daysTaken}
                                targetDays={record.targetDays}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Individual Mode */}
        {viewMode === "individual" &&
          (selectedUserId === "all" ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Please select a specific user to view individual performance.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* User Profile Card */}
              {selectedUserInfo && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {selectedUserInfo.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{selectedUserInfo.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedUserInfo.designation} | {selectedUserInfo.department}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                        {selectedUserInfo.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* KPI Cards */}
              {individualStats && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-2xl font-bold">{individualStats.totalRecords}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Total Tasks</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {individualStats.onTimePercentage}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">On-Time %</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {individualStats.overdueRecords}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Overdue Count</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {individualStats.avgDaysTaken}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Avg Completion Days</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Personal Category Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[var(--text-sm)] font-semibold">
                    Category Breakdown
                  </CardTitle>
                  <p className="text-[var(--text-xs)] text-muted-foreground">
                    Records by work category
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const catMap: Record<string, number> = {};
                          for (const r of filteredRecords) {
                            catMap[r.workCategory] = (catMap[r.workCategory] || 0) + 1;
                          }
                          return Object.entries(catMap)
                            .map(([category, count]) => ({ category, count }))
                            .sort((a, b) => b.count - a.count);
                        })()}
                        margin={{ top: 4, right: 20, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value) => [`${value} records`, "Count"]}
                        />
                        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Work Records Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[var(--text-sm)] font-semibold">
                    Work Records
                  </CardTitle>
                  <p className="text-[var(--text-xs)] text-muted-foreground">
                    {filteredRecords.length} records found
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[10px]">Date</TableHead>
                          <TableHead className="text-[10px]">Category</TableHead>
                          <TableHead className="text-[10px]">Description</TableHead>
                          <TableHead className="text-[10px]">Priority</TableHead>
                          <TableHead className="text-[10px]">Days/Target</TableHead>
                          <TableHead className="text-[10px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="h-16 text-center text-xs text-muted-foreground"
                            >
                              No records found for selected criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="text-xs font-mono">{record.date}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {record.workCategory}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs max-w-[250px] truncate">
                                {record.description}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "text-[10px]",
                                    record.priority === "CRITICAL"
                                      ? "bg-red-100 text-red-800"
                                      : record.priority === "HIGH"
                                        ? "bg-orange-100 text-orange-800"
                                        : record.priority === "MEDIUM"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800",
                                  )}
                                >
                                  {record.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <WorkKpiBadge
                                  daysTaken={record.daysTaken}
                                  targetDays={record.targetDays}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "text-[10px]",
                                    record.status === "CLOSED"
                                      ? "bg-green-100 text-green-800"
                                      : record.status === "VERIFIED"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : record.status === "SUBMITTED"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-blue-100 text-blue-800",
                                  )}
                                >
                                  {record.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ))}

        {/* Comparative Mode */}
        {viewMode === "comparative" && (
          <>
            {/* Comparison Table */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[var(--text-sm)] font-semibold">
                      Team Performance Comparison
                    </CardTitle>
                    <p className="text-[var(--text-xs)] text-muted-foreground">
                      Side-by-side KPI comparison across all users
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      const data = userProductivityStats.map((u) => ({
                        UserName: u.userName,
                        Department: u.department,
                        TotalRecords: u.totalRecords,
                        Completed: u.completedRecords,
                        OnTimePercent: u.onTimePercentage,
                        Overdue: u.overdueRecords,
                        AvgDays: u.avgDaysTaken,
                      }));
                      exportToCSV(data, "team-comparison.csv");
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Export Comparison
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px]">User Name</TableHead>
                        <TableHead className="text-[10px]">Department</TableHead>
                        <TableHead className="text-[10px]">Total Records</TableHead>
                        <TableHead className="text-[10px]">Completed</TableHead>
                        <TableHead className="text-[10px]">On-Time %</TableHead>
                        <TableHead className="text-[10px]">Overdue</TableHead>
                        <TableHead className="text-[10px]">Avg Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProductivityStats.map((user) => (
                        <TableRow
                          key={user.userId}
                          className={cn(
                            user.onTimePercentage > 90
                              ? "bg-green-50 dark:bg-green-950/20"
                              : user.onTimePercentage >= 70
                                ? "bg-amber-50 dark:bg-amber-950/20"
                                : "bg-red-50 dark:bg-red-950/20",
                          )}
                        >
                          <TableCell className="text-xs font-medium">{user.userName}</TableCell>
                          <TableCell className="text-xs">{user.department}</TableCell>
                          <TableCell className="text-xs font-mono">{user.totalRecords}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {user.completedRecords}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-[10px]",
                                user.onTimePercentage > 90
                                  ? "bg-green-100 text-green-800"
                                  : user.onTimePercentage >= 70
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800",
                              )}
                            >
                              {user.onTimePercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-red-600">
                            {user.overdueRecords}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{user.avgDaysTaken}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Horizontal Bar Chart - On-Time % Comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[var(--text-sm)] font-semibold">
                  On-Time Performance Comparison
                </CardTitle>
                <p className="text-[var(--text-xs)] text-muted-foreground">
                  Percentage of records completed within target days
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userProductivityStats.sort(
                        (a, b) => b.onTimePercentage - a.onTimePercentage,
                      )}
                      layout="vertical"
                      margin={{ top: 4, right: 30, bottom: 0, left: 80 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="userName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        width={75}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                        formatter={(value) => [`${value}%`, "On-Time"]}
                      />
                      <Bar dataKey="onTimePercentage" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageFrame>
  );
}
