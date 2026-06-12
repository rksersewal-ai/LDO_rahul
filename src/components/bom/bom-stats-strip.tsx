"use client";

import { Box, Cpu, FolderTree, Layers } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import type { BomEntry, BomProduct } from "@/lib/mock-data/bom";

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
    <GlassCard interactive className="flex flex-col items-center gap-1 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[var(--text-xs)] font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
    </GlassCard>
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
