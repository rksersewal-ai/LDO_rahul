"use client";

import { ExternalLink, Eye, Link2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { trpc } from "@/lib/trpc/client";
import { PlDocumentSearchLink } from "./pl-document-search-link";

interface PlDocumentsTabProps {
  plId: string;
}

function getCategoryBadgeColor(category: string): string {
  switch (category) {
    case "STR":
      return "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400";
    case "QAP":
      return "bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-400";
    case "EC":
    case "ELIGIBILITY_CRITERIA":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "TEST_CERTIFICATE":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
    case "INSPECTION_REPORT":
      return "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400";
    case "DRAWING":
      return "bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:text-indigo-400";
    case "SPECIFICATION":
      return "bg-pink-500/10 text-pink-700 border-pink-500/30 dark:text-pink-400";
    case "VENDOR_DOCUMENT":
      return "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400";
    case "SOS":
    case "SOR":
      return "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:text-teal-400";
    case "GAD":
    case "WIRING_DIAGRAM":
      return "bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-400";
    case "BOM_DOCUMENT":
      return "bg-lime-500/10 text-lime-700 border-lime-500/30 dark:text-lime-400";
    default:
      return "";
  }
}

export function PlDocumentsTab({ plId }: PlDocumentsTabProps) {
  const [page, setPage] = useState(1);
  const [unlinkTarget, setUnlinkTarget] = useState<{ documentId: string; title: string } | null>(
    null,
  );
  const pageSize = 10;

  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.pl.getDocuments.useQuery({
    plId,
    page,
    pageSize,
  });

  const unlinkMutation = trpc.pl.unlinkDocument.useMutation({
    onSuccess: () => {
      toast.success("Document unlinked successfully");
      setUnlinkTarget(null);
      utils.pl.getDocuments.invalidate({ plId });
    },
    onError: (err) => {
      toast.error(`Failed to unlink: ${err.message}`);
      setUnlinkTarget(null);
    },
  });

  const handleUnlink = (documentId: string) => {
    unlinkMutation.mutate({ plId, documentId });
  };

  const handleLinked = () => {
    utils.pl.getDocuments.invalidate({ plId });
  };

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
      <div className="flex flex-col gap-4">
        <PlDocumentSearchLink plId={plId} onLinked={handleLinked} />
        <EmptyState
          icon={<Link2 className="h-5 w-5" />}
          title="No linked documents"
          description="Link documents to this PL number to track related engineering documentation. Use the search above to find and link documents."
        />
      </div>
    );
  }

  const totalPages = Math.ceil(data.totalCount / pageSize);

  return (
    <div className="flex flex-col gap-3">
      {/* Search and link component */}
      <PlDocumentSearchLink plId={plId} onLinked={handleLinked} />

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
                Link Type
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                Linked At
              </th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((doc) => (
              <tr key={doc.linkId} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-mono font-medium">{doc.documentNumber}</td>
                <td className="px-3 py-2 truncate max-w-[200px]">{doc.title}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${getCategoryBadgeColor(doc.category)}`}
                  >
                    {doc.category.replace(/_/g, " ")}
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
                <td className="px-3 py-2 text-right">
                  {unlinkTarget?.documentId === doc.documentId ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-5 text-[10px] px-1.5"
                        onClick={() => handleUnlink(doc.documentId)}
                        disabled={unlinkMutation.isPending}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-1.5"
                        onClick={() => setUnlinkTarget(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        render={<Link href={`/documents/${doc.documentId}/preview`} />}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        render={<Link href={`/documents/${doc.documentId}`} />}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-destructive hover:text-destructive"
                        onClick={() =>
                          setUnlinkTarget({ documentId: doc.documentId, title: doc.title })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                        Unlink
                      </Button>
                    </div>
                  )}
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
