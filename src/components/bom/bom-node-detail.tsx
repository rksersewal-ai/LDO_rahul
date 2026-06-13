"use client";

import { Circle, FolderClosed, FolderOpen, Link2, Weight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BomEntry } from "@/lib/mock-data/bom";
import { trpc } from "@/lib/trpc/client";

interface BomNodeDetailProps {
  entry: BomEntry;
  onLinkPl: (entryId: string) => void;
}

function getTypeLabel(type: BomEntry["type"]) {
  switch (type) {
    case "assembly":
      return "Assembly";
    case "sub_assembly":
      return "Sub-Assembly";
    case "component":
      return "Component";
  }
}

function getTypeIcon(type: BomEntry["type"]) {
  switch (type) {
    case "assembly":
      return <FolderClosed className="size-4 text-amber-600 dark:text-amber-400" />;
    case "sub_assembly":
      return <FolderOpen className="size-4 text-blue-600 dark:text-blue-400" />;
    case "component":
      return <Circle className="size-3.5 text-muted-foreground" />;
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-b-0">
      <span className="text-[11px] text-muted-foreground w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground flex-1 min-w-0">{value}</span>
    </div>
  );
}

export function BomNodeDetail({ entry, onLinkPl }: BomNodeDetailProps) {
  const { data: plData } = trpc.pl.list.useQuery(
    { pageSize: 100 },
    { staleTime: 60_000 },
  );

  const plNumbers = plData?.data ?? [];
  const linkedPl = entry.plId ? plNumbers.find((p) => p.id === entry.plId) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{getTypeIcon(entry.type)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{entry.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] h-5">
              {getTypeLabel(entry.type)}
            </Badge>
            {entry.quantity > 1 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                Qty: {entry.quantity} {entry.unit}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* PL Link */}
      <div className="rounded-md border p-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Linked PL Number
          </span>
          <button
            type="button"
            onClick={() => onLinkPl(entry.id)}
            className="text-[10px] text-primary hover:underline"
          >
            {linkedPl ? "Change" : "Link PL"}
          </button>
        </div>
        {linkedPl ? (
          <Link
            href={`/pl/${linkedPl.id}`}
            className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5 hover:bg-primary/10 transition-colors"
          >
            <Link2 className="size-3 text-primary" />
            <span className="font-mono text-xs font-medium text-primary">{linkedPl.plNumber}</span>
            <span className="text-xs text-muted-foreground truncate">{linkedPl.name}</span>
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground italic">No PL number linked</p>
        )}
      </div>

      {/* Details */}
      <div className="rounded-md border p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Details
        </p>
        <div className="flex flex-col">
          <DetailRow label="Quantity" value={`${entry.quantity} ${entry.unit}`} />
          <DetailRow label="Material" value={entry.material} />
          <DetailRow
            label="Weight"
            value={
              entry.weight ? (
                <span className="inline-flex items-center gap-1">
                  <Weight className="size-3" />
                  {entry.weight.toLocaleString()} kg
                </span>
              ) : null
            }
          />
          <DetailRow label="Drawing Ref" value={entry.drawingRef} />
          <DetailRow label="Specifications" value={entry.specifications} />
          <DetailRow label="Vendor" value={entry.vendor} />
        </div>
      </div>
    </div>
  );
}
