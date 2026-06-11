"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface DisposalDataPoint {
  date: string;
  compliance: number;
}

interface DisposalChartProps {
  data: DisposalDataPoint[];
  className?: string;
}

// Generate mock disposal compliance data
export function generateDisposalData(): DisposalDataPoint[] {
  const data: DisposalDataPoint[] = [];
  const baseDate = new Date("2024-11-01");

  for (let i = 0; i < 45; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    // Simulate compliance between 70-98%
    const compliance = Math.round(75 + Math.random() * 23);
    data.push({
      date: date.toISOString().split("T")[0],
      compliance,
    });
  }
  return data;
}

export function DisposalChart({ data, className }: DisposalChartProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="mb-4">
        <h3 className="text-[var(--text-sm)] font-semibold text-foreground">
          Disposal Compliance Over Time
        </h3>
        <p className="text-[var(--text-xs)] text-muted-foreground">
          Percentage of work completed within target days
        </p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis
              domain={[60, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelFormatter={(v) => `Date: ${v}`}
              formatter={(value) => [`${value}%`, "Compliance"]}
            />
            <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="3 3" label="" />
            <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="3 3" label="" />
            <Line
              type="monotone"
              dataKey="compliance"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[var(--text-xs)]">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-emerald-500" style={{ borderTop: "2px dashed #22c55e" }} />
          <span className="text-muted-foreground">90% (Green threshold)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-amber-500" style={{ borderTop: "2px dashed #f59e0b" }} />
          <span className="text-muted-foreground">75% (Amber threshold)</span>
        </div>
      </div>
    </div>
  );
}
