"use client";

import { ArrowLeft, GitBranch } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

export default function PlBomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: pl } = trpc.pl.getById.useQuery({ id });
  const { data, isLoading, error } = trpc.pl.getBomUsage.useQuery({ plId: id });

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href={`/pl/${id}`} />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to {pl?.plNumber ?? "PL Detail"}
        </Button>

        <PageHeader
          title="BOM Usage"
          subtitle={pl ? `Bill of Materials usage for ${pl.plNumber} - ${pl.name}` : "Loading..."}
        />

        {isLoading ? (
          <LoadingState variant="table" rows={6} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load BOM data: {error.message}</p>
          </div>
        ) : !data || (data.asProduct.length === 0 && data.asComponent.length === 0) ? (
          <EmptyState
            icon={<GitBranch className="h-5 w-5" />}
            title="No BOM Usage"
            description="This PL number does not appear in any Bill of Materials."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* As Product */}
            <section>
              <h3 className="text-sm font-semibold mb-3">
                As Product
                {data.asProduct.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {data.asProduct.length}
                  </Badge>
                )}
              </h3>
              {data.asProduct.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  This PL is not registered as a BOM product.
                </p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Product Code
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Version
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.asProduct.map((product) => (
                        <tr key={product.id} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono font-medium">{product.productCode}</td>
                          <td className="px-3 py-2">{product.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{product.version}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* As Component */}
            <section>
              <h3 className="text-sm font-semibold mb-3">
                As Component
                {data.asComponent.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {data.asComponent.length}
                  </Badge>
                )}
              </h3>
              {data.asComponent.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  This PL is not used as a component in any BOM.
                </p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Item #
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Part Name
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Part Number
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.asComponent.map((entry) => (
                        <tr
                          key={entry.entryId}
                          className="border-b last:border-b-0 hover:bg-muted/30"
                        >
                          <td className="px-3 py-2">
                            <span className="font-mono font-medium">{entry.productCode}</span>
                            <span className="text-muted-foreground ml-1">
                              ({entry.productName})
                            </span>
                          </td>
                          <td className="px-3 py-2">{entry.itemNumber}</td>
                          <td className="px-3 py-2">{entry.partName}</td>
                          <td className="px-3 py-2 font-mono">{entry.partNumber}</td>
                          <td className="px-3 py-2">{entry.quantity}</td>
                          <td className="px-3 py-2 text-muted-foreground">{entry.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
