"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, RefreshCw, Train } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
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
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "under_overhaul", label: "Under Overhaul" },
  { value: "condemned", label: "Condemned" },
  { value: "transferred", label: "Transferred" },
  { value: "awaiting_commissioning", label: "Awaiting Commissioning" },
] as const;

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400";
    case "under_overhaul":
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400";
    case "condemned":
      return "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400";
    case "transferred":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400";
    case "awaiting_commissioning":
      return "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400";
    default:
      return "";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RollingStockPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workshopFilter, setWorkshopFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const virtualParentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = trpc.rollingStock.list.useQuery({
    search: search || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as
            | "active"
            | "under_overhaul"
            | "condemned"
            | "transferred"
            | "awaiting_commissioning")
        : undefined,
    homeWorkshop: workshopFilter || undefined,
    page,
    pageSize,
  });

  const items = data?.data ?? [];
  const useVirtual = items.length > 50;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => virtualParentRef.current,
    estimateSize: () => 40,
    overscan: 8,
  });

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Rolling Stock"
          subtitle="Track locomotives, coaches, and EMUs across workshops"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                render={<Link href="/rolling-stock/new" />}
              >
                <Plus className="h-3 w-3" />
                Add Unit
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search unit number, serial, workshop..."
            className="h-7 text-xs w-64"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-7 text-xs w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by workshop..."
            className="h-7 text-xs w-44"
            value={workshopFilter}
            onChange={(e) => {
              setWorkshopFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {data
              ? `Showing ${data.data.length} of ${data.totalCount} units (page ${data.page})`
              : "Loading..."}
          </p>
          {data && data.totalCount > pageSize && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                disabled={page * pageSize >= data.totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Data Table */}
        {isLoading ? (
          <LoadingState variant="table" rows={8} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              Failed to load rolling stock: {error.message}
            </p>
          </div>
        ) : data && data.data.length === 0 ? (
          <EmptyState
            icon={<Train className="size-8" />}
            title="No rolling stock units"
            description="Add your first rolling stock unit to start tracking locomotives and coaches."
          />
        ) : useVirtual ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Unit Number</TableHead>
                  <TableHead className="text-xs">Serial Number</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Home Workshop</TableHead>
                  <TableHead className="text-xs">Current Location</TableHead>
                  <TableHead className="text-xs">Commissioned</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div ref={virtualParentRef} className="overflow-auto" style={{ height: "500px" }}>
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const unit = items[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      className="absolute left-0 w-full flex items-center border-b text-xs hover:bg-muted/50"
                      style={{
                        top: 0,
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <span className="px-3 w-[16%]">
                        <Link
                          href={`/rolling-stock/${unit.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {unit.unitNumber}
                        </Link>
                      </span>
                      <span className="px-3 w-[16%] text-muted-foreground">
                        {unit.serialNumber ?? "-"}
                      </span>
                      <span className="px-3 w-[16%]">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", getStatusBadgeClass(unit.status))}
                        >
                          {formatStatus(unit.status)}
                        </Badge>
                      </span>
                      <span className="px-3 w-[18%]">{unit.homeWorkshop}</span>
                      <span className="px-3 w-[18%] text-muted-foreground">
                        {unit.currentLocation ?? "-"}
                      </span>
                      <span className="px-3 w-[16%] text-muted-foreground">
                        {unit.commissioningDate
                          ? new Date(unit.commissioningDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Unit Number</TableHead>
                  <TableHead className="text-xs">Serial Number</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Home Workshop</TableHead>
                  <TableHead className="text-xs">Current Location</TableHead>
                  <TableHead className="text-xs">Commissioned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Link
                        href={`/rolling-stock/${unit.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {unit.unitNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {unit.serialNumber ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", getStatusBadgeClass(unit.status))}
                      >
                        {formatStatus(unit.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{unit.homeWorkshop}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {unit.currentLocation ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {unit.commissioningDate
                        ? new Date(unit.commissioningDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
