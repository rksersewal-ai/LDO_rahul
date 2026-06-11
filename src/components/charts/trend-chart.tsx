"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendRange } from "@/hooks/use-dashboard-data";
import type { TrendDataPoint } from "@/lib/mock-data/dashboard";
import { cn } from "@/lib/utils";

const ranges: TrendRange[] = ["7D", "30D", "3M", "YTD"];

interface TrendChartProps {
  data: TrendDataPoint[];
  range: TrendRange;
  onRangeChange: (range: TrendRange) => void;
  className?: string;
}

export function TrendChart({ data, range, onRangeChange, className }: TrendChartProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[var(--text-sm)] font-semibold text-foreground">
            Document Upload Trend
          </h3>
          <p className="text-[var(--text-xs)] text-muted-foreground">
            Uploads vs processed over time
          </p>
        </div>
        {/* Range selectors */}
        <div className="flex items-center gap-0.5 rounded-md border bg-muted/50 p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded px-2 py-1 text-[var(--text-xs)] font-medium transition-colors",
                r === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="processedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
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
                boxShadow: "var(--shadow-popover)",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="uploads"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#uploadGradient)"
              name="Uploads"
            />
            <Area
              type="monotone"
              dataKey="processed"
              stroke="var(--chart-2)"
              strokeWidth={1.5}
              fill="url(#processedGradient)"
              name="Processed"
              strokeDasharray="4 2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
          <span className="text-[var(--text-xs)] text-muted-foreground">Uploads</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
          <span className="text-[var(--text-xs)] text-muted-foreground">Processed</span>
        </div>
      </div>
    </div>
  );
}
