"use client";

import { ArrowLeft, Link2, Plus } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/lib/trpc/client";

export default function PlDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: pl } = trpc.pl.getById.useQuery({ id });
  const { data, isLoading, error } = trpc.pl.getDocuments.useQuery({
    plId: id,
    page,
    pageSize,
  });

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
          title="Linked Documents"
          subtitle={pl ? `Documents linked to ${pl.plNumber} - ${pl.name}` : "Loading..."}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => toast.info("Link Document dialog coming soon. Use the Documents Hub to upload and link documents to this PL.")}
            >
              <Plus className="h-3 w-3" />
              Link Document
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState variant="table" rows={8} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load documents: {error.message}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<Link2 className="h-5 w-5" />}
            title="No linked documents"
            description="Link documents to this PL number to track related engineering documentation."
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {data.totalCount} document{data.totalCount !== 1 ? "s" : ""} linked
              </p>
            </div>

            <div className="rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Document #
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Link Type
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                      Linked At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((doc) => (
                    <tr key={doc.linkId} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono font-medium">{doc.documentNumber}</td>
                      <td className="px-3 py-2 truncate max-w-[250px]">{doc.title}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {doc.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {doc.linkType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {doc.confidence != null ? `${Math.round(doc.confidence * 100)}%` : "-"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {doc.linkedAt ? new Date(doc.linkedAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {Math.ceil(data.totalCount / pageSize) > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {Math.ceil(data.totalCount / pageSize)}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    disabled={page * pageSize >= data.totalCount}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageFrame>
  );
}
