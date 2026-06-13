"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BomCategoryFilter } from "@/components/bom/bom-category-filter";
import { BomProductCard } from "@/components/bom/bom-product-card";
import { BomRecentlyModified } from "@/components/bom/bom-recently-modified";
import { BomStatsStrip } from "@/components/bom/bom-stats-strip";
import { PageFrame } from "@/components/layout/page-frame";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import type { BomProductCategory } from "@/lib/mock-data/bom";
import { trpc } from "@/lib/trpc/client";

export default function BomExplorerPage() {
  const [activeCategory, setActiveCategory] = useState<BomProductCategory | "all">("all");

  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.bom.products.useQuery(undefined, { staleTime: 30_000 });

  const products = (productsData ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    code: p.code as string,
    version: (p.version as string) ?? "1.0",
    status: (p.status as string) ?? "draft",
    category: (p.category as BomProductCategory) ?? "locomotive",
    lifecycle: (p.lifecycle as string) ?? "development",
    description: (p.description as string) ?? "",
    createdBy: (p.createdBy as string) ?? "",
    createdAt: (p.createdAt as string) ?? "",
    updatedAt: (p.updatedAt as string) ?? "",
    entryCount: (p.entryCount as number) ?? 0,
  }));
  const entries: unknown[] = [];

  const categories = products.map((p) => p.category);

  const filteredProducts =
    activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);

  const productsWithCounts = filteredProducts.map((p) => ({
    ...p,
    entryCount: p.entryCount,
  }));

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="BOM Explorer"
          subtitle="Bill of Materials - Hierarchical product structure management"
          actions={
            <div className="flex items-center gap-2">
              <ExportDropdown
                title="BOM Explorer"
                headers={["Name", "Code", "Version", "Status", "Category", "Lifecycle", "Entries"]}
                rows={productsWithCounts.map((p) => [
                  p.name,
                  p.code,
                  p.version,
                  p.status,
                  p.category,
                  p.lifecycle,
                  p.entryCount,
                ])}
                filenamePrefix="bom-products"
              />
              <Button size="sm" className="h-7 text-xs gap-1" render={<Link href="/bom/new" />}>
                <Plus className="h-3 w-3" />
                New Product
              </Button>
            </div>
          }
        />

        {/* Stats Strip */}
        <BomStatsStrip products={products as never} entries={entries as never} />

        {/* Category Filter */}
        <BomCategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Error State */}
        {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

        {/* Loading skeleton */}
        {isLoading && <LoadingState variant="card" rows={8} className="lg:grid-cols-4" />}

        {/* Product Cards Grid */}
        {!isLoading && !isError && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productsWithCounts.map((product) => (
              <BomProductCard
                key={product.id}
                product={product as never}
                entryCount={product.entryCount}
              />
            ))}
          </div>
        )}

        {/* Recently Modified */}
        <BomRecentlyModified entries={entries as never} products={products as never} />
      </div>
    </PageFrame>
  );
}
