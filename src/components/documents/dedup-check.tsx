"use client";

import { AlertTriangle, CheckCircle, FileText, Hash, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DedupResult {
  fullHash: string;
  threePointHash: string;
  isDuplicate: boolean;
  existingDocumentNumber?: string;
  existingDocumentTitle?: string;
  existingDocumentId?: string;
}

interface DedupCheckProps {
  result: DedupResult;
  onLinkExisting: () => void;
  onUploadNew: () => void;
  className?: string;
}

export function DedupCheck({ result, onLinkExisting, onUploadNew, className }: DedupCheckProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Hash display */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
          <Hash className="h-3.5 w-3.5" />
          Hash Results
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-medium text-muted-foreground w-24 shrink-0 pt-0.5">
              SHA-256:
            </span>
            <code className="text-[10px] font-mono text-foreground break-all bg-muted px-1.5 py-0.5 rounded">
              {result.fullHash}
            </code>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-medium text-muted-foreground w-24 shrink-0 pt-0.5">
              3-Point 64KB:
            </span>
            <code className="text-[10px] font-mono text-foreground break-all bg-muted px-1.5 py-0.5 rounded">
              {result.threePointHash}
            </code>
          </div>
        </div>
      </div>

      {/* Match result */}
      {result.isDuplicate ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-warning">Duplicate Detected</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            A file with an identical hash already exists in the system.
          </p>

          {/* Existing document card */}
          <div className="rounded-md border bg-card p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-xs font-medium">{result.existingDocumentNumber}</span>
            </div>
            <p className="text-xs text-muted-foreground">{result.existingDocumentTitle}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onLinkExisting}
            >
              <Link2 className="h-3 w-3" />
              Link to existing
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={onUploadNew}>
              Upload as new revision
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <div>
              <h3 className="text-sm font-semibold text-success">No Duplicates Found</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                This file is unique. You can proceed with metadata entry.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
