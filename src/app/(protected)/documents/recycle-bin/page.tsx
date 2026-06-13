"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageFrame } from "@/components/layout/page-frame";
import { EmptyStateFallback } from "@/components/shared/empty-state-fallback";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function RecycleBinPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = trpc.documents.listDeleted.useQuery({
    limit: 100,
    offset: 0,
    search: search || undefined,
  });

  const restore = trpc.documents.restore.useMutation({
    onSuccess: () => {
      toast.success("Document restored");
      utils.documents.listDeleted.invalidate();
      utils.documents.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const items = data?.data ?? [];

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Recycle Bin"
          subtitle="Soft-deleted documents — restorable. Files are never physically deleted."
        />

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search deleted documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs w-64"
          />
          <Badge variant="outline" className="text-[10px] h-5 ml-auto">
            {data?.total ?? 0} in bin
          </Badge>
        </div>

        {isLoading && <LoadingState variant="table" rows={6} columns={4} />}
        {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyStateFallback
            title="Recycle bin is empty"
            description="Deleted documents appear here and can be restored at any time."
          />
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Document</TableHead>
                  <TableHead className="text-[11px]">Category</TableHead>
                  <TableHead className="text-[11px]">Deleted</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {doc.documentNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] h-4 capitalize">
                        {doc.category?.toLowerCase() ?? "other"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {doc.deletedAt
                        ? new Date(doc.deletedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] gap-1"
                        disabled={restore.isPending}
                        onClick={() => restore.mutate({ id: doc.id })}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
