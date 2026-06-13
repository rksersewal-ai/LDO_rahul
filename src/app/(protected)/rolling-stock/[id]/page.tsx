"use client";

import { ArrowLeft, ClipboardList, Package, Train } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
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

function getWorkRecordStatusClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-500/10 text-green-700 border-green-500/20";
    case "in_progress":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    case "open":
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    case "on_hold":
      return "bg-orange-500/10 text-orange-700 border-orange-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-700 border-red-500/20";
    default:
      return "";
  }
}

export default function RollingStockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = trpc.rollingStock.getById.useQuery({ id });

  if (isLoading) {
    return (
      <PageFrame>
        <LoadingState variant="card" rows={3} />
      </PageFrame>
    );
  }

  if (error || !data) {
    return (
      <PageFrame>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-sm text-muted-foreground">
            {error ? error.message : "Rolling stock unit not found"}
          </p>
          <Button variant="outline" size="sm" render={<Link href="/rolling-stock" />}>
            Back to Rolling Stock
          </Button>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 -ml-2"
            render={<Link href="/rolling-stock" />}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Rolling Stock
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
              <Train className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{data.unitNumber}</h1>
              <p className="text-xs text-muted-foreground">
                {data.serialNumber ? `S/N: ${data.serialNumber}` : "No serial number"}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs", getStatusBadgeClass(data.status))}
          >
            {formatStatus(data.status)}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Location
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Home Workshop</span>
                <span className="font-medium">{data.homeWorkshop}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current Location</span>
                <span className="font-medium">{data.currentLocation ?? "Same as home"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dates
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Manufactured</span>
                <span className="font-medium">
                  {data.manufacturedDate
                    ? new Date(data.manufacturedDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Commissioned</span>
                <span className="font-medium">
                  {data.commissioningDate
                    ? new Date(data.commissioningDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {data.product && (
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Package className="inline size-3 mr-1" />
                Linked BOM Product
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Product</span>
                  <Link
                    href={`/bom/${data.product.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {data.product.name}
                  </Link>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-medium">{data.product.productCode}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-xs text-foreground/80 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Work History */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Work History</h3>
            <Badge variant="secondary" className="text-[10px]">
              {data.workRecords.length}
            </Badge>
          </div>

          {data.workRecords.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No work records linked to this unit yet.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Work Order</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workRecords.map((wr) => (
                    <TableRow key={wr.id}>
                      <TableCell className="text-xs font-medium">
                        {wr.workOrderNumber}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {wr.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", getWorkRecordStatusClass(wr.status))}
                        >
                          {formatStatus(wr.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{wr.priority}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(wr.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
