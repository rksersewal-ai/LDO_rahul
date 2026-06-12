"use client";

import { Link2, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { trpc } from "@/lib/trpc/client";

interface PlDocumentsTabProps {
  plId: string;
}

export function PlDocumentsTab({ plId }: PlDocumentsTabProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = trpc.pl.getDocuments.useQuery({
    plId,
    page,
    pageSize,
  });

  if (isLoading) {
    return <LoadingState variant="table" rows={5} />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">Failed to load documents: {error.message}</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={<Link2 className="h-5 w-5" />}
        title="No linked documents"
        description="Link documents to this PL number to track related engineering documentation."
        actionLabel="Link Document"
        onAction={() => {}}
      />
    );
  }

  const totalPages = Math.ceil(data.totalCount / pageSize);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data.totalCount} document{data.totalCount !== 1 ? "s" : ""} linked
        </p>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          Link Document
        </Button>
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
                <td className="px-3 py-2 truncate max-w-[200px]">{doc.title}</td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {doc.category}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
