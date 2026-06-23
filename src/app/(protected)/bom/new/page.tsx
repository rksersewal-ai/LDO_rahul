"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import type { BomProductCategory, BomProductLifecycle } from "@/lib/mock-data/bom";
import { trpc } from "@/lib/trpc/client";

const CATEGORY_OPTIONS: { value: BomProductCategory; label: string }[] = [
  { value: "locomotive", label: "Locomotive" },
  { value: "coach", label: "Coach" },
  { value: "wagon", label: "Wagon" },
];

const LIFECYCLE_OPTIONS: { value: BomProductLifecycle; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "production", label: "Production" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BomProductCategory>("locomotive");
  const [lifecycle, setLifecycle] = useState<BomProductLifecycle>("development");
  const [error, setError] = useState("");

  const createProduct = trpc.bom.createProduct.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        router.push(`/bom/${data.id}`);
      } else {
        router.push("/bom");
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to create product");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !code.trim() || !description.trim()) {
      setError("All fields are required");
      return;
    }

    createProduct.mutate({
      name: name.trim(),
      code: code.trim(),
      description: description.trim(),
      category,
      lifecycle,
    });
  }

  return (
    <PageFrame size="sm">
      <div className="flex flex-col gap-4">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href="/bom" />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to BOM Explorer
        </Button>

        <PageHeader
          title="Create Product"
          subtitle="Define a new product for BOM structure management"
        />

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name" className="text-xs font-medium">
                Product Name *
              </Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., WAP-7 Locomotive"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-code" className="text-xs font-medium">
                Product Code *
              </Label>
              <Input
                id="product-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., WAP7-CLW-2024"
                className="h-9 text-sm font-mono"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Unique identifier for this product. Cannot be changed after creation.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-desc" className="text-xs font-medium">
                Description *
              </Label>
              <Textarea
                id="product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the product..."
                className="min-h-[80px] text-sm resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-category" className="text-xs font-medium">
                  Category
                </Label>
                <select
                  id="product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BomProductCategory)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="product-lifecycle" className="text-xs font-medium">
                  Lifecycle Stage
                </Label>
                <select
                  id="product-lifecycle"
                  value={lifecycle}
                  onChange={(e) => setLifecycle(e.target.value as BomProductLifecycle)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {LIFECYCLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={createProduct.isPending}
              >
                {createProduct.isPending ? "Creating..." : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => router.push("/bom")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageFrame>
  );
}
