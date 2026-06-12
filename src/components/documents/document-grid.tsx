"use client";

import type { MockDocument } from "@/lib/mock-data/documents";
import { cn } from "@/lib/utils";
import { DocumentGridCard } from "./document-grid-card";

interface DocumentGridProps {
  data: MockDocument[];
  className?: string;
}

export function DocumentGrid({ data, className }: DocumentGridProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No documents found.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        className,
      )}
    >
      {data.map((doc) => (
        <DocumentGridCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
