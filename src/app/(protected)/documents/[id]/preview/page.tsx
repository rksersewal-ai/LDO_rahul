"use client";

import {
  ArrowLeft,
  Boxes,
  BrainCircuit,
  ExternalLink,
  FileCode2,
  FileImage,
  FileText,
  Fingerprint,
  Loader2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";
import {
  getAssertionsForDocument,
  getEntitiesForDocument,
  groupAssertionsByField,
  groupEntitiesByType,
} from "@/lib/mock-data/ocr-intelligence";
import { MOCK_PL_NUMBERS } from "@/lib/mock-data/pl-numbers";

function mapDocStatus(status: string): StatusType {
  switch (status) {
    case "ACTIVE":
      return "done";
    case "APPROVED":
      return "done";
    case "DRAFT":
      return "pending";
    case "UNDER_REVIEW":
      return "in_process";
    case "OBSOLETE":
      return "failed";
    default:
      return "pending";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  const normalized = fileType.toUpperCase();
  if (["PNG", "JPG", "JPEG", "SVG", "TIFF", "IMAGE"].includes(normalized)) {
    return FileImage;
  }
  if (normalized === "PDF") {
    return FileText;
  }
  return FileCode2;
}

function canEmbedFile(fileType: string, fileUrl: string | null): boolean {
  if (!fileUrl) return false;
  const normalized = fileType.toUpperCase();
  return ["PDF", "PNG", "JPG", "JPEG", "SVG", "TIFF", "IMAGE"].includes(normalized);
}

function isImageType(fileType: string): boolean {
  const normalized = fileType.toUpperCase();
  return ["PNG", "JPG", "JPEG", "SVG", "TIFF", "IMAGE"].includes(normalized);
}

function humanizeToken(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duplicateBadgeClass(isDuplicate: boolean): string {
  if (isDuplicate) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
}

export default function DocumentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [minimized, setMinimized] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  const doc = MOCK_DOCUMENTS.find((d) => d.id === id);

  // OCR intelligence data
  const assertions = useMemo(() => (doc ? getAssertionsForDocument(doc.id) : []), [doc]);
  const entities = useMemo(() => (doc ? getEntitiesForDocument(doc.id) : []), [doc]);
  const assertionGroups = useMemo(() => groupAssertionsByField(assertions), [assertions]);
  const entityGroups = useMemo(() => groupEntitiesByType(entities), [entities]);

  // Linked PL data
  const linkedPls = useMemo(() => {
    if (!doc?.linkedPlIds?.length) return [];
    return doc.linkedPlIds
      .map((plId) => MOCK_PL_NUMBERS.find((pl) => pl.id === plId))
      .filter(Boolean);
  }, [doc]);

  const navigateBack = useCallback(() => {
    router.back();
  }, [router]);

  const openFullDocument = useCallback(() => {
    router.push(`/documents/${id}`);
  }, [router, id]);

  const openInNewTab = useCallback(() => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  }, []);

  const closePreview = useCallback(() => {
    navigateBack();
  }, [navigateBack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      switch (event.key) {
        case "Escape":
          closePreview();
          break;
        case "m":
        case "M":
          setMinimized(true);
          break;
        case "o":
        case "O":
          openFullDocument();
          break;
        case "n":
        case "N":
          openInNewTab();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview, openFullDocument, openInNewTab]);

  if (!doc) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">Document not found</p>
          <Button variant="outline" size="sm" onClick={navigateBack}>
            <ArrowLeft className="h-3 w-3" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const FileIcon = getFileIcon(doc.fileType);
  const fileUrl = doc.filePath || null;
  const embedable = canEmbedFile(doc.fileType, fileUrl);
  const isImage = isImageType(doc.fileType);

  // Minimized state - bottom-right floating card
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[120]">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-4 py-3 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-primary/20">
          <FileIcon className="h-4 w-4 text-primary/90" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{doc.title}</p>
            <p className="text-[11px] text-muted-foreground">Preview minimized</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setMinimized(false)}>
            Restore
          </Button>
          <Button size="sm" onClick={openFullDocument}>
            Open
          </Button>
          <button
            type="button"
            aria-label="Close preview"
            onClick={closePreview}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-center p-4">
        <div className="flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
            <div className="min-w-0">
              {/* Badges row */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium">
                  Floating preview
                </Badge>
                <Badge variant="outline" className="text-[10px] font-medium uppercase">
                  {doc.fileType}
                </Badge>
                <StatusBadge
                  status={mapDocStatus(doc.status)}
                  label={doc.status.replace("_", " ")}
                />
                {doc.isDuplicate && (
                  <Badge variant="destructive" className="text-[10px] font-medium">
                    Duplicate
                  </Badge>
                )}
              </div>
              {/* Title */}
              <h1 className="truncate text-xl font-semibold text-foreground">{doc.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {doc.documentNumber} &middot; Rev {doc.revision} &middot;{" "}
                {formatFileSize(doc.fileSize)}
              </p>
              {/* Keyboard hints */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-md border bg-background px-2 py-1">Esc close</span>
                <span className="rounded-md border bg-background px-2 py-1">M minimize</span>
                <span className="rounded-md border bg-background px-2 py-1">O full document</span>
                <span className="rounded-md border bg-background px-2 py-1">N new tab</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={navigateBack}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <Button size="sm" variant="secondary" onClick={openFullDocument}>
                Open full document
              </Button>
              <Button size="sm" variant="secondary" onClick={openInNewTab}>
                <ExternalLink className="h-3.5 w-3.5" />
                New tab
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMinimized(true)}>
                <Minimize2 className="h-3.5 w-3.5" />
                Minimize
              </Button>
              <button
                type="button"
                aria-label="Close preview"
                onClick={closePreview}
                className="rounded-md border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content: Viewer + Side Panel */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Viewer */}
            <div className="min-h-0 overflow-hidden rounded-lg border border-border bg-background">
              {embedable ? (
                isImage ? (
                  <div className="flex h-full items-center justify-center overflow-auto p-6">
                    {/* biome-ignore lint/performance/noImgElement: Document preview images use dynamic external URLs that cannot be optimized */}
                    <img
                      src={fileUrl as string}
                      alt={doc.title}
                      className="max-h-full max-w-full rounded-2xl border border-border bg-white/95 object-contain shadow-2xl"
                    />
                  </div>
                ) : (
                  <iframe
                    title={`${doc.title} preview`}
                    src={fileUrl as string}
                    className="h-full w-full"
                  />
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <FileIcon className="h-16 w-16 text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{doc.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Inline rendering is not available for this file type. Use the full document
                      page or open the file directly.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" onClick={openFullDocument}>
                      Open full document
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right-side panel */}
            <div className="min-h-0 overflow-y-auto rounded-xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md">
              <div className="space-y-4">
                {/* Document Summary */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Document summary
                  </p>
                  <div className="space-y-3 rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">ID</span>
                      <span className="font-mono text-xs text-foreground">{doc.id}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <StatusBadge
                        status={mapDocStatus(doc.status)}
                        label={doc.status.replace("_", " ")}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Revision</span>
                      <span className="font-mono text-xs text-foreground">{doc.revision}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Linked PL</span>
                      <span className="text-xs text-foreground">
                        {doc.linkedPlIds.length > 0
                          ? `${doc.linkedPlIds.length} linked`
                          : "Unlinked"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">File</span>
                      <span className="text-xs text-foreground">
                        {doc.fileType.toUpperCase()} &middot; {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Updated</span>
                      <span className="text-xs text-foreground">
                        {formatDateTime(doc.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OCR Intelligence */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-cyan-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      OCR Intelligence
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    {/* Approved Assertions */}
                    {Object.keys(assertionGroups).length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Approved Assertions
                        </p>
                        {Object.entries(assertionGroups).map(([fieldKey, fieldAssertions]) => (
                          <div key={fieldKey}>
                            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                              {humanizeToken(fieldKey)}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {fieldAssertions.map((a) => (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                                >
                                  {a.normalizedValue}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No approved assertions available.
                      </p>
                    )}

                    {/* Extracted Entities */}
                    {Object.keys(entityGroups).length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-border pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Extracted Entities
                        </p>
                        {Object.entries(entityGroups).map(([entityType, typeEntities]) => (
                          <div key={entityType}>
                            <div className="mb-1 text-xs font-semibold text-foreground">
                              {humanizeToken(entityType)}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {typeEntities.map((e) => (
                                <span
                                  key={e.id}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-foreground"
                                >
                                  {e.normalizedValue}
                                  <span className="text-muted-foreground">
                                    {Math.round(e.confidence)}%
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reindex button */}
                    <div className="mt-3 border-t border-border pt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        disabled={isReindexing}
                        onClick={() => {
                          setIsReindexing(true);
                          // In production: trpc.ocr.retrigger.mutate({ documentId: id })
                          setTimeout(() => {
                            setIsReindexing(false);
                            toast.success("OCR reindex queued successfully");
                          }, 1200);
                        }}
                      >
                        {isReindexing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {isReindexing ? "Reindexing..." : "Reindex"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Search & Dedup */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-amber-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Search & Dedup
                    </p>
                  </div>
                  <div className="space-y-3 rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Duplicate state</span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${duplicateBadgeClass(doc.isDuplicate)}`}
                      >
                        {doc.isDuplicate ? "DUPLICATE" : "UNIQUE"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Fingerprint</span>
                      <span className="text-xs text-foreground">
                        {doc.fileHash ? "Present" : "Missing"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Hash indexed</span>
                      <span className="text-xs text-foreground">
                        {formatDateTime(doc.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Search indexed</span>
                      <span className="text-xs text-foreground">
                        {formatDateTime(doc.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linked PL Navigation */}
                {linkedPls.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-foreground" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Linked PL
                      </p>
                    </div>
                    <div className="space-y-2">
                      {linkedPls.map((pl) =>
                        pl ? (
                          <div
                            key={pl.id}
                            className="rounded-lg border border-border bg-background p-3"
                          >
                            <p className="font-mono text-xs font-semibold text-foreground">
                              {pl.plNumber}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{pl.name}</p>
                            <Link href={`/pl/${pl.id}`}>
                              <Button size="sm" variant="secondary" className="mt-2 w-full">
                                Open linked PL
                              </Button>
                            </Link>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
