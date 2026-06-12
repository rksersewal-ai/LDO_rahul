"use client";

import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

export default function CabinetDetailPage() {
  const params = useParams();
  const cabinetId = params.id as string;
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: cabinet, isLoading: loadingCabinet } = trpc.cabinets.get.useQuery({ id: cabinetId });
  const {
    data: docsData,
    isLoading: loadingDocs,
    refetch,
  } = trpc.cabinets.getDocuments.useQuery({ cabinetId, page, pageSize });
  const removeMutation = trpc.cabinets.removeDocument.useMutation({ onSuccess: () => refetch() });

  function handleRemove(documentId: string) {
    if (confirm("Remove this document from the cabinet?")) {
      removeMutation.mutate({ cabinetId, documentId });
    }
  }

  const isLoading = loadingCabinet || loadingDocs;

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-4">
        <PageHeader
          title={cabinet?.name ?? "Cabinet"}
          subtitle={cabinet?.description ?? "Documents in this cabinet"}
          breadcrumb={
            <Link href="/cabinets" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="h-3 w-3" />
              Back to Cabinets
            </Link>
          }
        />

        {isLoading ? (
          <LoadingState variant="table" rows={6} />
        ) : !docsData || docsData.data.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No documents"
            description="This cabinet is empty. Add documents from the document hub."
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {docsData.data.length} of {docsData.totalCount} documents (page {docsData.page})
              </p>
              {docsData.totalCount > pageSize && (
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
                    disabled={page * pageSize >= docsData.totalCount}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docsData.data.map((doc) => (
                    <TableRow key={doc.documentId}>
                      <TableCell className="font-mono text-xs">{doc.documentNumber}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.addedAt ? new Date(doc.addedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleRemove(doc.documentId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </PageFrame>
  );
}
