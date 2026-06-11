"use client";

import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Link2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { OcrResultsPanel } from "@/components/documents/ocr-results-panel";
import { OcrStatusBadge } from "@/components/documents/ocr-status-badge";
import { type RevisionEntry, RevisionTimeline } from "@/components/documents/revision-timeline";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";
import { MOCK_OCR_JOBS } from "@/lib/mock-data/ocr-jobs";
import { MOCK_PL_NUMBERS } from "@/lib/mock-data/pl-numbers";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapDocStatus(status: string): StatusType {
  switch (status) {
    case "ACTIVE":
      return "done";
    case "DRAFT":
      return "pending";
    case "UNDER_REVIEW":
      return "in_process";
    case "APPROVED":
      return "done";
    case "OBSOLETE":
      return "failed";
    default:
      return "pending";
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "DRAWING":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
    case "SPECIFICATION":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400";
    case "TEST_REPORT":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    case "CERTIFICATE":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    case "STANDARD":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Generate mock revision history from the current document.
 */
function generateRevisionHistory(doc: (typeof MOCK_DOCUMENTS)[0]): RevisionEntry[] {
  const currentRev = Number.parseInt(doc.revision.replace("R", ""), 10);
  const revisions: RevisionEntry[] = [];

  for (let i = currentRev; i >= 0; i--) {
    const isFirst = i === 0;
    const isCurrent = i === currentRev;
    const date = new Date(doc.createdAt);
    date.setMonth(date.getMonth() + i * 2);

    revisions.push({
      revision: `R${i}`,
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      uploadedBy: doc.agency,
      status: isCurrent ? doc.status : "ACTIVE",
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
  const doc = MOCK_DOCUMENTS.find((d) => d.id === id);

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

  const linkedPls = MOCK_PL_NUMBERS.filter((pl) => doc.linkedPlIds.includes(pl.id));
  const revisions = generateRevisionHistory(doc);

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
                className={cn("text-xs font-semibold", getCategoryColor(doc.category))}
              >
                {doc.category.replace("_", " ")}
              </Badge>
              <StatusBadge status={mapDocStatus(doc.status)} label={doc.status.replace("_", " ")} />
              <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {doc.revision}
              </span>
            </div>
            <h2 className="text-base font-medium text-foreground">{doc.title}</h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Download className="h-3 w-3" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              New Revision
            </Button>
            {doc.status === "UNDER_REVIEW" && (
              <>
                <Button size="sm" className="h-7 text-xs gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-destructive border-destructive/30"
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-3 gap-5">
          {/* Left column: Metadata + OCR */}
          <div className="col-span-2 flex flex-col gap-5">
            {/* Metadata section */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                Document Metadata
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <MetaField label="Document Number" value={doc.documentNumber} mono />
                <MetaField label="Title" value={doc.title} />
                <MetaField label="Category" value={doc.category.replace("_", " ")} />
                <MetaField label="Status" value={doc.status.replace("_", " ")} />
                <MetaField label="Revision" value={doc.revision} mono />
                <MetaField label="Revision Date" value={doc.revisionDate || "Not set"} />
                <MetaField label="Agency" value={doc.agency} />
                <MetaField label="Owner" value={doc.ownerId} />
                <MetaField label="File Type" value={doc.fileType.toUpperCase()} />
                <MetaField label="File Size" value={formatFileSize(doc.fileSize)} />
                <MetaField label="Pages" value={String(doc.pages)} />
                <MetaField
                  label="Created"
                  value={new Date(doc.createdAt).toLocaleDateString("en-IN")}
                />
                <MetaField
                  label="Last Updated"
                  value={new Date(doc.updatedAt).toLocaleDateString("en-IN")}
                />
                <MetaField label="Uploaded By" value={doc.uploadedBy} />
                <div className="col-span-2">
                  <MetaField
                    label="File Hash (SHA-256)"
                    value={doc.fileHash || "Not computed"}
                    mono
                  />
                </div>
                {doc.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags.map((tag) => (
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
                <OcrStatusBadge status={doc.ocrStatus} confidence={doc.ocrConfidence} />
              </div>
              {doc.ocrStatus === "COMPLETED" &&
                (() => {
                  const ocrJob = MOCK_OCR_JOBS.find(
                    (j) => j.documentId === doc.id && j.status === "COMPLETED",
                  );
                  if (ocrJob?.structuredOutput) {
                    return (
                      <OcrResultsPanel
                        structuredOutput={ocrJob.structuredOutput}
                        rawText={ocrJob.rawText}
                        confidence={ocrJob.confidence ?? doc.ocrConfidence ?? 0}
                      />
                    );
                  }
                  // Fallback to raw text display
                  return doc.ocrText ? (
                    <div className="flex flex-col gap-2">
                      {doc.ocrConfidence != null && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Confidence:</span>
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              doc.ocrConfidence >= 90
                                ? "text-success"
                                : doc.ocrConfidence >= 75
                                  ? "text-warning"
                                  : "text-destructive",
                            )}
                          >
                            {doc.ocrConfidence}%
                          </span>
                        </div>
                      )}
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                          {doc.ocrText}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
              {doc.ocrStatus === "PROCESSING" && (
                <p className="text-xs text-muted-foreground">OCR processing in progress...</p>
              )}
              {doc.ocrStatus === "FAILED" && (
                <p className="text-xs text-destructive">
                  OCR processing failed. You may retry or manually enter data.
                </p>
              )}
              {doc.ocrStatus !== "COMPLETED" &&
                doc.ocrStatus !== "PROCESSING" &&
                doc.ocrStatus !== "FAILED" && (
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
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                  <Link2 className="h-3 w-3" />
                  Link PL
                </Button>
              </div>
              {linkedPls.length > 0 ? (
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
