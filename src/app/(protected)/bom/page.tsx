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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { type BomProductCategory, MOCK_BOM_ENTRIES, MOCK_BOM_PRODUCTS } from "@/lib/mock-data/bom";

export default function BomExplorerPage() {
  const [activeCategory, setActiveCategory] = useState<BomProductCategory | "all">("all");

  const products = MOCK_BOM_PRODUCTS;
  const entries = MOCK_BOM_ENTRIES;

  const categories = products.map((p) => p.category);

  const filteredProducts =
    activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);

  const productsWithCounts = filteredProducts.map((p) => ({
    ...p,
    entryCount: entries.filter((e) => e.productId === p.id).length,
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
        <BomStatsStrip products={products} entries={entries} />

        {/* Category Filter */}
        <BomCategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Product Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productsWithCounts.map((product) => (
            <BomProductCard key={product.id} product={product} entryCount={product.entryCount} />
          ))}
        </div>

        {/* Recently Modified */}
        <BomRecentlyModified entries={entries} products={products} />
      </div>
    </PageFrame>
  );
}
