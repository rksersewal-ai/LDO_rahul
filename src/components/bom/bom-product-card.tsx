"use client";

import { FolderTree } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BomProduct, BomProductLifecycle } from "@/lib/mock-data/bom";
import { cn } from "@/lib/utils";

interface BomProductCardProps {
  product: BomProduct;
  entryCount: number;
}

const lifecycleConfig: Record<BomProductLifecycle, { label: string; className: string }> = {
  production: {
    label: "Production",
    className: "bg-success/10 text-success border-success/20",
  },
  development: {
    label: "Development",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  retired: {
    label: "Retired",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function BomProductCard({ product, entryCount }: BomProductCardProps) {
  const lifecycle = lifecycleConfig[product.lifecycle];

  return (
    <Link href={`/bom/${product.id}`}>
      <Card
        className={cn(
          "p-4 cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-[var(--shadow-card)]",
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderTree className="size-4 text-primary shrink-0" />
            <h3 className="text-[var(--text-sm)] font-semibold truncate">{product.name}</h3>
          </div>
          <span
            className={cn(
              "inline-flex items-center shrink-0 rounded-full px-2 py-0.5 text-[var(--text-xs)] font-medium border",
              lifecycle.className,
            )}
          >
            {lifecycle.label}
          </span>
        </div>

        <p className="text-[var(--text-xs)] text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] h-5 capitalize">
            {product.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 font-mono">
            {product.code}
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5">
            v{product.version}
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-5">
            {entryCount} entries
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
