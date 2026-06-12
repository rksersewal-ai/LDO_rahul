"use client";

import { File, FileImage, FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import type { DocumentCategory, MockDocument } from "@/lib/mock-data/documents";
import { cn } from "@/lib/utils";
import { OcrStatusBadge } from "./ocr-status-badge";

function getCategoryColor(category: DocumentCategory): string {
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
    case "TENDER":
      return "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400";
    case "SDR":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
    default:
      return "bg-muted text-muted-foreground";
  }
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

function getFileTypeIcon(fileType: string) {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return FileText;
    case "png":
    case "jpg":
    case "jpeg":
    case "tiff":
      return FileImage;
    case "xlsx":
    case "xls":
    case "csv":
      return FileSpreadsheet;
    default:
      return File;
  }
}

interface DocumentGridCardProps {
  document: MockDocument;
}

export function DocumentGridCard({ document }: DocumentGridCardProps) {
  const FileIcon = getFileTypeIcon(document.fileType);

  return (
    <Link href={`/documents/${document.id}`} className="block">
      <GlassCard interactive className="p-4 flex flex-col gap-3 h-full">
        {/* Header: document number + file type icon */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[11px] font-medium text-primary truncate">
            {document.documentNumber}
          </span>
          <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        {/* Title */}
        <p className="text-xs font-medium leading-snug line-clamp-2 min-h-[2.25rem]">
          {document.title}
        </p>

        {/* Category + Status badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("text-[9px] font-semibold", getCategoryColor(document.category))}
          >
            {document.category.replace("_", " ")}
          </Badge>
          <StatusBadge
            status={mapDocStatus(document.status)}
            label={document.status.replace("_", " ")}
          />
        </div>

        {/* OCR Status */}
        <div className="flex items-center">
          <OcrStatusBadge status={document.ocrStatus} confidence={document.ocrConfidence} />
        </div>

        {/* Meta row: file type, pages, revision */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border/50">
          <span className="uppercase text-[10px] font-medium text-muted-foreground">
            {document.fileType}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {document.pages} {document.pages === 1 ? "page" : "pages"}
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            Rev {document.revision}
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}
