"use client";

import { ClipboardList, Cpu, ExternalLink, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) {
    return <span>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  let lastIndex = 0;
  let idx = lower.indexOf(queryLower);

  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <mark key={idx} className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    lastIndex = idx + query.length;
    idx = lower.indexOf(queryLower, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span>{parts}</span>;
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
              <HighlightedText text={result.title} query={query} />
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.subtitle}</p>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase shrink-0">
            {typeLabels[result.type]}
          </span>
        </div>

        {/* Match highlight */}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          <HighlightedText text={result.matchText} query={query} />
        </p>

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
          className="flex items-center justify-center size-6 rounded hover:bg-accent"
          title="Open in new tab"
        >
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
