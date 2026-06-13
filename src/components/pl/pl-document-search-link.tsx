"use client";

import { FileText, Link2, Loader2, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { trpc } from "@/lib/trpc/client";

interface PlDocumentSearchLinkProps {
  plId: string;
  onLinked?: () => void;
}

const LINK_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "bom_inferred", label: "BOM Inferred" },
  { value: "work_record_inferred", label: "Work Record" },
] as const;

function getCategoryColor(category: string): string {
  switch (category) {
    case "STR":
      return "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400";
    case "QAP":
      return "bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-400";
    case "EC":
    case "ELIGIBILITY_CRITERIA":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "TEST_CERTIFICATE":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
    case "INSPECTION_REPORT":
      return "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400";
    case "DRAWING":
      return "bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:text-indigo-400";
    case "SPECIFICATION":
      return "bg-pink-500/10 text-pink-700 border-pink-500/30 dark:text-pink-400";
    default:
      return "";
  }
}

export function PlDocumentSearchLink({ plId, onLinked }: PlDocumentSearchLinkProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [linkType, setLinkType] = useState<string>("manual");
  const [isOpen, setIsOpen] = useState(false);

  const { data: results, isFetching } = trpc.pl.searchDocumentsForLinking.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 1 },
  );

  const linkMutation = trpc.pl.linkDocument.useMutation({
    onSuccess: () => {
      toast.success("Document linked successfully");
      setSearchQuery("");
      setIsOpen(false);
      onLinked?.();
    },
    onError: (error) => {
      toast.error(`Failed to link document: ${error.message}`);
    },
  });

  const handleSelect = useCallback(
    (documentId: string) => {
      linkMutation.mutate({
        plId,
        documentId,
        linkType: linkType as "manual" | "ocr_candidate" | "ocr_accepted" | "bom_inferred" | "work_record_inferred",
      });
    },
    [plId, linkType, linkMutation],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div
            className="flex items-center"
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter") setIsOpen(true); }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-2 w-full rounded-md border px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50">
              <Search className="h-3 w-3" />
              <span>Search documents to link...</span>
            </div>
          </div>
        </div>
        <select
          className="h-7 rounded-md border bg-background px-2 text-xs"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
        >
          {LINK_TYPES.map((lt) => (
            <option key={lt.value} value={lt.value}>
              {lt.label}
            </option>
          ))}
        </select>
      </div>

      {isOpen && (
        <div className="rounded-md border shadow-md bg-popover">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type document number or title..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isFetching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isFetching && searchQuery.length >= 1 && (!results || results.length === 0) && (
                <CommandEmpty>No documents found</CommandEmpty>
              )}
              {results && results.length > 0 && (
                <CommandGroup heading="Search Results">
                  {results.map((doc) => (
                    <CommandItem
                      key={doc.id}
                      value={doc.id}
                      onSelect={() => handleSelect(doc.id)}
                      disabled={linkMutation.isPending}
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-xs font-mono font-medium truncate">
                          {doc.documentNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {doc.title}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] shrink-0 ${getCategoryColor(doc.category)}`}
                      >
                        {doc.category}
                      </Badge>
                      <Link2 className="h-3 w-3 text-primary shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          <div className="border-t px-2 py-1.5 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery("");
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
