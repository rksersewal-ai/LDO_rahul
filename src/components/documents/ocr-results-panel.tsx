"use client";

import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OcrStructuredOutput } from "@/lib/ocr/pipeline-config";
import { cn } from "@/lib/utils";

interface OcrResultsPanelProps {
  structuredOutput: OcrStructuredOutput;
  rawText?: string | null;
  confidence: number;
  className?: string;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-success";
  if (confidence >= 75) return "text-warning";
  return "text-destructive";
}

function getConfidenceBarColor(confidence: number): string {
  if (confidence >= 90) return "bg-success";
  if (confidence >= 75) return "bg-warning";
  return "bg-destructive";
}

export function OcrResultsPanel({
  structuredOutput,
  rawText,
  confidence,
  className,
}: OcrResultsPanelProps) {
  const [showRawText, setShowRawText] = useState(false);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Confidence Score */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            OCR Confidence
          </span>
          <span className={cn("text-sm font-bold", getConfidenceColor(confidence))}>
            {confidence}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", getConfidenceBarColor(confidence))}
            style={{ width: `${Math.min(confidence, 100)}%` }}
          />
        </div>
      </div>

      {/* Extracted Fields Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {structuredOutput.drawingNumber && (
          <ExtractedField label="Drawing Number" value={structuredOutput.drawingNumber} mono />
        )}
        {structuredOutput.title && <ExtractedField label="Title" value={structuredOutput.title} />}
        {structuredOutput.revision && (
          <ExtractedField label="Revision" value={structuredOutput.revision} mono />
        )}
        {structuredOutput.sheetInfo && (
          <ExtractedField label="Sheet Info" value={structuredOutput.sheetInfo} />
        )}
        {structuredOutput.scale && (
          <ExtractedField label="Scale" value={structuredOutput.scale} mono />
        )}
        {structuredOutput.date && <ExtractedField label="Date" value={structuredOutput.date} />}
        {structuredOutput.approvedBy && (
          <ExtractedField label="Approved By" value={structuredOutput.approvedBy} />
        )}
      </div>

      {/* PL Numbers */}
      {structuredOutput.plNumbers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            Extracted PL Numbers
          </span>
          <div className="flex flex-wrap gap-1.5">
            {structuredOutput.plNumbers.map((pl) => (
              <Link
                key={pl}
                href={`/pl?search=${pl}`}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-mono hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                {pl}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {structuredOutput.warnings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Warnings</span>
          <div className="flex flex-col gap-1">
            {structuredOutput.warnings.map((warning) => (
              <div key={warning} className="flex items-center gap-1.5 text-xs text-warning">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No warnings indicator */}
      {structuredOutput.warnings.length === 0 && (
        <div className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle className="h-3 w-3" />
          <span>All fields extracted successfully</span>
        </div>
      )}

      {/* Raw Text Toggle */}
      {rawText && (
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit h-6 text-[10px] gap-1 -ml-1"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showRawText ? "Hide Raw Text" : "Show Raw Text"}
          </Button>
          {showRawText && (
            <div className="rounded-md bg-muted/50 p-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">{rawText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExtractedField({
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
      <span className={cn("text-xs text-foreground", mono && "font-mono")}>{value}</span>
    </div>
  );
}
