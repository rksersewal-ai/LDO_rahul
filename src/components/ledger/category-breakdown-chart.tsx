"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WORK_CATEGORIES } from "@/lib/mock-data/work-categories";
import type { MockWorkRecord } from "@/lib/mock-data/work-records";
import { cn } from "@/lib/utils";

interface CategoryBreakdownChartProps {
  records: MockWorkRecord[];
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  DWG: "#3b82f6",
  SPEC: "#8b5cf6",
  TENDER: "#ef4444",
  INSP: "#f59e0b",
  TEST: "#10b981",
  CERT: "#06b6d4",
  CORR: "#6366f1",
  PROC: "#ec4899",
  SDR: "#f97316",
  PL: "#14b8a6",
};

export function generateCategoryBreakdown(records: MockWorkRecord[]) {
  return WORK_CATEGORIES.map((cat) => {
    const count = records.filter((r) => r.workCategory === cat.code).length;
    return {
      category: cat.label,
      code: cat.code,
      count,
      fill: CATEGORY_COLORS[cat.code] || "#6b7280",
    };
  }).filter((item) => item.count > 0);
}

export function CategoryBreakdownChart({ records, className }: CategoryBreakdownChartProps) {
  const data = generateCategoryBreakdown(records);

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="mb-4">
        <h3 className="text-[var(--text-sm)] font-semibold text-foreground">Records by Category</h3>
        <p className="text-[var(--text-xs)] text-muted-foreground">
          Work distribution across categories
        </p>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 20, bottom: 0, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              width={70}
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
            <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--chart-1)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
