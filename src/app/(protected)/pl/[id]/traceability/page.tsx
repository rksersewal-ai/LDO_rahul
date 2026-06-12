"use client";

import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

export default function PlTraceabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: pl } = trpc.pl.getById.useQuery({ id });
  const { data: summary, isLoading: summaryLoading } = trpc.pl.getTraceabilitySummary.useQuery({ plId: id });
  const { data: ocrHits, isLoading: ocrLoading } = trpc.pl.getOcrHits.useQuery({ plId: id });

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
          title="Traceability"
          subtitle={pl ? `Full traceability for ${pl.plNumber} - ${pl.name}` : "Loading..."}
        />

        {/* Summary cards */}
        {summaryLoading ? (
          <LoadingState variant="card" rows={2} />
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground font-normal">
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{summary.documents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground font-normal">
                  BOM Products
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{summary.bomProducts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground font-normal">
                  BOM Components
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{summary.bomComponents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground font-normal">
                  Work Records
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{summary.workRecords}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground font-normal">
                  OCR Hits
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{summary.ocrHits}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* OCR Hits Table */}
        <section>
          <h3 className="text-sm font-semibold mb-3">OCR Hits</h3>
          {ocrLoading ? (
            <LoadingState variant="table" rows={5} />
          ) : !ocrHits || ocrHits.length === 0 ? (
            <div className="rounded-md border p-4 text-center">
              <p className="text-xs text-muted-foreground">No OCR hits found for this PL number.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      PL Number
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      MOD11
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ocrHits.map((hit) => (
                    <tr key={hit.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div>
                          <span className="font-mono font-medium">{hit.documentNumber}</span>
                          <span className="text-muted-foreground ml-1 block truncate max-w-[180px]">
                            {hit.documentTitle}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono">{hit.plNumber}</td>
                      <td className="px-3 py-2">
                        {hit.confidence != null ? `${Math.round(Number(hit.confidence) * 100)}%` : "-"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {hit.pageNumber ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={hit.mod11Valid ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {hit.mod11Valid ? "Valid" : "Invalid"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {hit.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Accept"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  );
}
