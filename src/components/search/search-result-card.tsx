"use client";

import { ClipboardList, Cpu, ExternalLink, Eye, FileText, ScanText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { highlightText } from "@/lib/utils/highlight-text";
import type { SearchResult } from "@/lib/validators/search";

const typeIcons: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  document: FileText,
  pl: Cpu,
  work_record: ClipboardList,
  case: FileText,
};

const typeLabels: Record<SearchResult["type"], string> = {
  document: "Document",
  pl: "PL Number",
  work_record: "Work Record",
  case: "Case",
};

function humanizeReason(reason: string): string {
  return reason
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  className?: string;
}

export function SearchResultCard({ result, query, className }: SearchResultCardProps) {
  const Icon = typeIcons[result.type];

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
        className,
      )}
    >
      {/* Type Icon */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={result.url}
              className="text-sm font-medium hover:underline underline-offset-2 line-clamp-1"
            >
              {highlightText(result.title, query)}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.subtitle}</p>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase shrink-0">
            {typeLabels[result.type]}
          </span>
        </div>

        {/* Match highlight with OCR indicator */}
        <div className="flex items-center gap-1.5 mt-1">
          {result.matchField === "OCR Text" && (
            <ScanText className="size-3 text-violet-400 shrink-0" />
          )}
          {result.matchField && (
            <span className="text-[10px] text-muted-foreground shrink-0">{result.matchField}:</span>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {highlightText(result.matchText, query)}
          </p>
        </div>

        {/* Match reason badges */}
        {result.matchReasons && result.matchReasons.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {result.matchReasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-200"
              >
                {humanizeReason(reason)}
              </span>
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {result.badges.map((badge) => (
            <Badge key={badge} variant="secondary" className="text-[10px] h-4 px-1.5">
              {badge}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Link
          href={result.url}
          className="flex items-center justify-center size-6 rounded hover:bg-accent"
          title="View"
        >
          <Eye className="size-3.5" />
        </Link>
        <Link
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-6 rounded hover:bg-accent"
          title="Open in new tab"
        >
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
