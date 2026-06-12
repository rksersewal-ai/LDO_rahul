"use client";

import { Box, Cpu, FolderTree, Layers } from "lucide-react";
import type { BomEntry, BomProduct } from "@/lib/mock-data/bom";
import { cn } from "@/lib/utils";

interface BomStatsStripProps {
  products: BomProduct[];
  entries: BomEntry[];
}

interface StatBlockProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatBlock({ icon, label, value }: StatBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border bg-card p-3",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-[var(--shadow-card)]",
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[var(--text-xs)] font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
    </div>
  );
}

export function BomStatsStrip({ products, entries }: BomStatsStripProps) {
  const totalProducts = products.length;
  const totalNodes = entries.length;
  const inProduction = products.filter((p) => p.lifecycle === "production").length;
  const totalParts = entries.filter((e) => e.type === "component").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatBlock
        icon={<FolderTree className="size-3.5" />}
        label="Products"
        value={totalProducts}
      />
      <StatBlock icon={<Layers className="size-3.5" />} label="Nodes" value={totalNodes} />
      <StatBlock icon={<Cpu className="size-3.5" />} label="In Production" value={inProduction} />
      <StatBlock icon={<Box className="size-3.5" />} label="Parts" value={totalParts} />
    </div>
  );
}
