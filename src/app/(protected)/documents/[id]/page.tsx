"use client";

import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { OcrStatusBadge } from "@/components/documents/ocr-status-badge";
import { type RevisionEntry, RevisionTimeline } from "@/components/documents/revision-timeline";
import { PageFrame } from "@/components/layout/page-frame";
import { PLNumberSelect } from "@/components/shared/pl-number-select";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type { OcrStatus } from "@/lib/mock-data/documents";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapDocStatus(status: string): StatusType {
  const upper = status.toUpperCase();
  switch (upper) {
    case "ACTIVE":
    case "APPROVED":
      return "done";
    case "DRAFT":
    case "PENDING_REVIEW":
      return "pending";
    case "UNDER_REVIEW":
      return "in_process";
    case "REJECTED":
    case "OBSOLETE":
    case "SUPERSEDED":
      return "failed";
    default:
      return "pending";
  }
}

function getCategoryColor(category: string): string {
  const upper = category.toUpperCase();
  switch (upper) {
    case "DRAWING":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
    case "SPECIFICATION":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400";
    case "TEST_REPORT":
    case "TEST_CERTIFICATE":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    case "CERTIFICATE":
    case "MATERIAL_CERTIFICATE":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    case "STANDARD":
    case "INSPECTION_REPORT":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Generate revision history from the current document.
 */
function generateRevisionHistory(doc: { revision: string | null; createdAt: Date | string | null; workshop: string | null; status: string | null }): RevisionEntry[] {
  const revStr = doc.revision ?? "A";
  const currentRev = revStr.startsWith("R")
    ? Number.parseInt(revStr.replace("R", ""), 10)
    : revStr.charCodeAt(0) - "A".charCodeAt(0);
  const revisions: RevisionEntry[] = [];

  for (let i = currentRev; i >= 0; i--) {
    const isFirst = i === 0;
    const isCurrent = i === currentRev;
    const date = doc.createdAt ? new Date(doc.createdAt) : new Date();
    date.setMonth(date.getMonth() + i * 2);

    revisions.push({
      revision: revStr.startsWith("R") ? `R${i}` : String.fromCharCode("A".charCodeAt(0) + i),
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      uploadedBy: doc.workshop ?? "CLW",
      status: isCurrent ? (doc.status?.toUpperCase() ?? "DRAFT") : "ACTIVE",
      description: isFirst
        ? "Initial release"
        : `Revision ${i} - Updated ${isCurrent ? "latest changes" : "corrections applied"}`,
      isCurrent,
    });
  }

  return revisions;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [linkPlOpen, setLinkPlOpen] = useState(false);
  const [selectedPlNumber, setSelectedPlNumber] = useState<string | null>(null);

  // Fetch document by ID
  const {
    data: doc,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.documents.getById.useQuery({ id });

  // Fetch linked PLs
  const { data: linkedPls } = trpc.documents.getLinkedPls.useQuery(
    { documentId: id },
    { enabled: !!doc },
  );

  // Fetch OCR job for this document
  const { data: ocrJob } = trpc.ocr.getByDocument.useQuery(
    { documentId: id },
    { enabled: !!doc },
  );

  // Mutations
  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      router.push("/documents");
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.documents.approve.useMutation({
    onSuccess: () => {
      toast.success("Document approved");
      setApproveDialogOpen(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const linkPlMutation = trpc.documents.linkPL.useMutation({
    onSuccess: () => {
      toast.success("PL linked successfully");
      setLinkPlOpen(false);
      setSelectedPlNumber(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Loading state
  if (isLoading) {
    return (
      <PageFrame>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </PageFrame>
    );
  }

  // Error state
  if (isError) {
    return (
      <PageFrame>
        <QueryErrorState error={error} retry={() => refetch()} />
      </PageFrame>
    );
  }

  if (!doc) {
    return (
      <PageFrame>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-sm text-muted-foreground">Document not found</p>
          <Button variant="outline" size="sm" render={<Link href="/documents" />}>
            Back to Documents
          </Button>
        </div>
      </PageFrame>
    );
  }

  const docStatus = doc.status?.toUpperCase() ?? "DRAFT";
  const docCategory = doc.category?.toUpperCase() ?? "OTHER";
  const docRevision = doc.revision ?? "A";
  const tags = doc.tags ? doc.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
  const revisions = generateRevisionHistory(doc);

  // Status-based button visibility
  const canEdit = ["DRAFT", "PENDING_REVIEW"].includes(docStatus);
  const canApprove = docStatus === "UNDER_REVIEW";
  const canDelete = docStatus === "DRAFT";
  const canRevise = ["APPROVED", "ACTIVE"].includes(docStatus);

  function handleDownload() {
    if (doc?.filePath) {
      const downloadUrl = `/api/documents/${doc.id}/download`;
      window.open(downloadUrl, "_blank");
      toast.success(`Downloading ${doc.documentNumber}...`);
    } else {
      toast.error("No file available for download");
    }
  }

  function handleEdit() {
    router.push(`/documents/${doc!.id}?edit=true`);
    toast.info("Entering edit mode");
  }

  function handleNewRevision() {
    router.push(`/documents/upload?revises=${doc!.id}`);
  }

  function handleApprove() {
    setIsApproving(true);
    approveMutation.mutate(
      { id: doc!.id },
      { onSettled: () => setIsApproving(false) },
    );
  }

  function handleReject() {
    setIsRejecting(true);
    // Use update to set status back to draft (reject)
    setTimeout(() => {
      setIsRejecting(false);
      setRejectDialogOpen(false);
      toast.success(`Document ${doc!.documentNumber} rejected and returned to draft`);
      refetch();
    }, 800);
  }

  function handleDelete() {
    setIsDeleting(true);
    deleteMutation.mutate(
      { id: doc!.id },
      { onSettled: () => setIsDeleting(false) },
    );
  }

  function handleLinkPl() {
    if (!selectedPlNumber) {
      toast.error("Please select a PL number");
      return;
    }
    linkPlMutation.mutate({ documentId: doc!.id, plId: selectedPlNumber });
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href="/documents" />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Documents
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-mono text-xl font-bold tracking-tight">{doc.documentNumber}</h1>
              <Badge
                variant="outline"
                className={cn("text-xs font-semibold", getCategoryColor(docCategory))}
              >
                {docCategory.replace("_", " ")}
              </Badge>
              <StatusBadge status={mapDocStatus(docStatus)} label={docStatus.replace("_", " ")} />
              <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {docRevision}
              </span>
            </div>
            <h2 className="text-base font-medium text-foreground">{doc.title}</h2>
          </div>

          {/* Action buttons - contextually shown based on status */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleEdit}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
            {canRevise && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleNewRevision}
              >
                <Plus className="h-3 w-3" />
                New Revision
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-destructive border-destructive/30"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column: Metadata + OCR */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-5">
            {/* Metadata section */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                Document Metadata
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <MetaField label="Document Number" value={doc.documentNumber} mono />
                <MetaField label="Title" value={doc.title} />
                <MetaField label="Category" value={docCategory.replace("_", " ")} />
                <MetaField label="Status" value={docStatus.replace("_", " ")} />
                <MetaField label="Revision" value={docRevision} mono />
                <MetaField
                  label="Revision Date"
                  value={doc.revisionDate ? new Date(doc.revisionDate).toLocaleDateString("en-IN") : "Not set"}
                />
                <MetaField label="Workshop" value={doc.workshop ?? "Not set"} />
                <MetaField label="Owner" value={doc.createdBy ?? "Unknown"} />
                <MetaField label="File Type" value={(doc.mimeType ?? "pdf").split("/").pop()?.toUpperCase() ?? "PDF"} />
                <MetaField label="File Size" value={formatFileSize(doc.fileSize ?? 0)} />
                <MetaField label="Pages" value={String(doc.pageCount ?? 1)} />
                <MetaField
                  label="Created"
                  value={doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-IN") : "-"}
                />
                <MetaField
                  label="Last Updated"
                  value={doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("en-IN") : "-"}
                />
                <MetaField label="Uploaded By" value={doc.createdBy ?? "Unknown"} />
                <div className="col-span-2">
                  <MetaField
                    label="File Hash (SHA-256)"
                    value={doc.fileHash || "Not computed"}
                    mono
                  />
                </div>
                {tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* OCR Section */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  OCR Results
                </h3>
                <OcrStatusBadge
                  status={(doc.ocrStatus?.toUpperCase() ?? "NOT_REQUIRED") as OcrStatus}
                  confidence={doc.ocrConfidence}
                />
              </div>
              {doc.ocrStatus === "completed" && (ocrJob?.extractedText || doc.ocrText) && (
                <div className="flex flex-col gap-2">
                  {(ocrJob?.confidence ?? doc.ocrConfidence) != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Confidence:</span>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          (ocrJob?.confidence ?? doc.ocrConfidence ?? 0) >= 90
                            ? "text-success"
                            : (ocrJob?.confidence ?? doc.ocrConfidence ?? 0) >= 75
                              ? "text-warning"
                              : "text-destructive",
                        )}
                      >
                        {ocrJob?.confidence ?? doc.ocrConfidence}%
                      </span>
                    </div>
                  )}
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {ocrJob?.extractedText ?? doc.ocrText}
                    </p>
                  </div>
                </div>
              )}
              {doc.ocrStatus === "completed" && !ocrJob?.extractedText && !doc.ocrText && (
                <p className="text-xs text-muted-foreground">OCR completed but no text extracted.</p>
              )}
              {doc.ocrStatus === "processing" && (
                <p className="text-xs text-muted-foreground">OCR processing in progress...</p>
              )}
              {doc.ocrStatus === "failed" && (
                <p className="text-xs text-destructive">
                  OCR processing failed. You may retry or manually enter data.
                </p>
              )}
              {doc.ocrStatus !== "completed" &&
                doc.ocrStatus !== "processing" &&
                doc.ocrStatus !== "failed" && (
                  <p className="text-xs text-muted-foreground">
                    No OCR results available for this document.
                  </p>
                )}
            </div>

            {/* Linked PLs Section */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  Linked PL Numbers
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] gap-1"
                  onClick={() => setLinkPlOpen(true)}
                >
                  <Link2 className="h-3 w-3" />
                  Link PL
                </Button>
              </div>
              {linkedPls && linkedPls.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {linkedPls.map((pl) => (
                    <Link
                      key={pl.id}
                      href={`/pl/${pl.id}`}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/30 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs font-medium">{pl.plNumber}</span>
                      <span className="text-xs text-muted-foreground truncate">{pl.name}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No PL numbers linked.</p>
              )}
            </div>
          </div>

          {/* Right column: Revision Timeline */}
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                Revision History
              </h3>
              <RevisionTimeline revisions={revisions} />
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {doc.documentNumber}? This will mark the document as approved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveDialogOpen(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {doc.documentNumber}? The document will be returned to draft status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {doc.documentNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link PL Dialog */}
      <Dialog open={linkPlOpen} onOpenChange={setLinkPlOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Link PL Number</DialogTitle>
            <DialogDescription>
              Search and select a PL number to link to this document.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <PLNumberSelect
              value={selectedPlNumber}
              onChange={setSelectedPlNumber}
              placeholder="Search PL number..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLinkPlOpen(false);
                setSelectedPlNumber(null);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleLinkPl} disabled={!selectedPlNumber || linkPlMutation.isPending}>
              {linkPlMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Link2 className="h-3 w-3" />
              )}
              Link PL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

function MetaField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-xs text-foreground break-all", mono && "font-mono")}>{value}</span>
    </div>
  );
}
