"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
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
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data/work-records";
import { cn } from "@/lib/utils";

export default function LedgerReportsPage() {
  const disposalData = useMemo(() => generateDisposalData(), []);

  // Overdue items
  const overdueItems = useMemo(() => {
    return MOCK_WORK_RECORDS.filter((r) => r.daysTaken > r.targetDays).sort(
      (a, b) => b.daysTaken - b.targetDays - (a.daysTaken - a.targetDays),
    );
  }, []);

  // User productivity data
  const productivityData = useMemo(() => {
    const userMap: Record<string, number> = {};
    for (const record of MOCK_WORK_RECORDS) {
      userMap[record.userName] = (userMap[record.userName] || 0) + 1;
    }
    return Object.entries(userMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const days: Record<string, { date: string; total: number; completed: number }> = {};
    for (const record of MOCK_WORK_RECORDS) {
      if (!days[record.date]) {
        days[record.date] = { date: record.date, total: 0, completed: 0 };
      }
      days[record.date].total += 1;
      if (record.status === "VERIFIED" || record.status === "CLOSED") {
        days[record.date].completed += 1;
      }
    }
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Ledger Reports"
          subtitle="Work record analytics and disposal compliance reporting"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
            </div>
          }
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Disposal Compliance Chart */}
          <DisposalChart data={disposalData} />

          {/* Category Breakdown */}
          <CategoryBreakdownChart records={MOCK_WORK_RECORDS} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                        <TableCell className="text-xs font-mono">{record.workTypeCode}</TableCell>
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
      </div>
    </PageFrame>
  );
}
