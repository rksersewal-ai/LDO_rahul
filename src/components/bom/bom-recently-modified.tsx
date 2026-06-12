"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BomEntry, BomProduct } from "@/lib/mock-data/bom";

interface BomRecentlyModifiedProps {
  entries: BomEntry[];
  products: BomProduct[];
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}

const typeLabels: Record<string, string> = {
  assembly: "Assembly",
  sub_assembly: "Sub-assembly",
  component: "Component",
};

export function BomRecentlyModified({ entries, products }: BomRecentlyModifiedProps) {
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-muted-foreground" />
        <h3 className="text-[var(--text-sm)] font-semibold text-foreground">Recently Modified</h3>
      </div>

      <div className="flex flex-col gap-2">
        {recentEntries.map((entry) => {
          const product = productMap.get(entry.productId);
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[var(--text-sm)] font-medium text-foreground truncate">
                  {entry.name}
                </span>
                <span className="text-[var(--text-xs)] text-muted-foreground truncate">
                  {product?.name ?? "Unknown product"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] h-5">
                  {typeLabels[entry.type] ?? entry.type}
                </Badge>
                <span className="text-[var(--text-xs)] text-muted-foreground whitespace-nowrap">
                  {timeAgo(entry.updatedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
