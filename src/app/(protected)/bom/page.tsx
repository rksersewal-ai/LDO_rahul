"use client";

import { FolderTree, Plus } from "lucide-react";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { MOCK_BOM_ENTRIES, MOCK_BOM_PRODUCTS } from "@/lib/mock-data/bom";

function mapProductStatus(status: string): StatusType {
  switch (status) {
    case "active":
      return "done";
    case "draft":
      return "pending";
    case "deprecated":
      return "failed";
    default:
      return "pending";
  }
}

export default function BomExplorerPage() {
  const products = MOCK_BOM_PRODUCTS.map((p) => ({
    ...p,
    entryCount: MOCK_BOM_ENTRIES.filter((e) => e.productId === p.id).length,
  }));

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="BOM Explorer"
          subtitle="Bill of Materials - Hierarchical product structure management"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" render={<Link href="/bom/new" />}>
              <Plus className="h-3 w-3" />
              New Product
            </Button>
          }
        />

        {/* Product Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/bom/${product.id}`}>
              <Card className="p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="size-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                  </div>
                  <StatusBadge status={mapProductStatus(product.status)} label={product.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-5 font-mono">
                    {product.code}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    v{product.version}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {product.entryCount} entries
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
