"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Eye, FileText, GripVertical, Link2, Plus, Search, Unlink, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc/client";

type LinkRole = "general" | "te" | "prototype_approval" | "correspondence";

const ROLES: ReadonlyArray<{ key: LinkRole; label: string; hint: string }> = [
  { key: "general", label: "General Documents", hint: "Drawings, test certificates, manuals" },
  { key: "te", label: "Technical Evaluation (TE)", hint: "TE reports & evaluations" },
  { key: "prototype_approval", label: "Prototype Approval", hint: "Prototype approval documents" },
  {
    key: "correspondence",
    label: "Queries & Correspondence",
    hint: "Query letters & correspondence",
  },
];

const ROLE_LABEL: Record<LinkRole, string> = {
  general: "General",
  te: "TE",
  prototype_approval: "Prototype Approval",
  correspondence: "Correspondence",
};

interface LinkedDoc {
  linkId: string;
  documentId: string;
  documentNumber: string;
  title: string;
  category: string;
  status: string;
  linkRole: string | null;
}

interface SearchDoc {
  id: string;
  documentNumber: string;
  title: string;
  category: string;
}

/** A draggable search-result card with a "Link to" fallback menu. */
function DraggableSearchResult({
  doc,
  alreadyLinked,
  onLink,
}: {
  doc: SearchDoc;
  alreadyLinked: boolean;
  onLink: (documentId: string, role: LinkRole) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `search-${doc.id}`,
    data: { docId: doc.id },
    disabled: alreadyLinked,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-xs ${
        alreadyLinked ? "opacity-50" : ""
      }`}
    >
      {!alreadyLinked && (
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Drag to link"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono font-medium">{doc.documentNumber}</p>
        <p className="truncate text-muted-foreground">{doc.title}</p>
      </div>
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {doc.category}
      </Badge>
      {alreadyLinked ? (
        <Badge variant="outline" className="shrink-0 text-[10px]">
          Linked
        </Badge>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="h-6 shrink-0 gap-1 text-[10px]" />
            }
          >
            <Plus className="h-3 w-3" />
            Link
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Link as…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLES.map((role) => (
              <DropdownMenuItem key={role.key} onClick={() => onLink(doc.id, role.key)}>
                {role.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/** A droppable role column listing the documents linked under that role. */
function RoleColumn({
  role,
  docs,
  onUnlink,
}: {
  role: (typeof ROLES)[number];
  docs: LinkedDoc[];
  onUnlink: (documentId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `role-${role.key}`, data: { role: role.key } });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-md border transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/20"
      }`}
    >
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">{role.label}</p>
          <Badge variant="secondary" className="text-[10px]">
            {docs.length}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">{role.hint}</p>
      </div>
      <div className="min-h-[80px] flex-1 space-y-1.5 p-2">
        {docs.length === 0 ? (
          <p className="px-1 py-3 text-center text-[11px] text-muted-foreground">
            Drag a document here, or use the “Link” menu.
          </p>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.linkId}
              className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-xs"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono font-medium">{doc.documentNumber}</p>
                <p className="truncate text-muted-foreground">{doc.title}</p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {doc.category}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                render={<Link href={`/documents/${doc.documentId}/preview`} />}
                aria-label={`Preview ${doc.documentNumber}`}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => onUnlink(doc.documentId)}
                aria-label={`Unlink ${doc.documentNumber}`}
              >
                <Unlink className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function DocumentAssociationEngine({ plId }: { plId: string }) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");

  const linkedQuery = trpc.pl.getLinkedDocs.useQuery({ plId });
  const searchResults = trpc.pl.searchDocumentsForLinking.useQuery(
    { query: search.trim(), limit: 20 },
    { enabled: search.trim().length >= 1 },
  );

  const invalidate = () => {
    utils.pl.getLinkedDocs.invalidate({ plId });
    utils.pl.getDocuments.invalidate();
    utils.pl.ledger.invalidate();
    utils.pl.getTraceabilitySummary.invalidate({ plId });
  };

  const linkMutation = trpc.pl.linkDocument.useMutation({ onSuccess: invalidate });
  const unlinkMutation = trpc.pl.unlinkDocument.useMutation({ onSuccess: invalidate });

  const linked = (linkedQuery.data ?? []) as LinkedDoc[];
  const linkedIds = useMemo(() => new Set(linked.map((d) => d.documentId)), [linked]);

  const byRole = useMemo(() => {
    const groups: Record<LinkRole, LinkedDoc[]> = {
      general: [],
      te: [],
      prototype_approval: [],
      correspondence: [],
    };
    for (const doc of linked) {
      const role = (doc.linkRole as LinkRole) ?? "general";
      (groups[role] ?? groups.general).push(doc);
    }
    return groups;
  }, [linked]);

  async function handleLink(documentId: string, role: LinkRole) {
    if (linkedIds.has(documentId)) {
      toast.info("Document is already linked to this PL.");
      return;
    }
    try {
      await linkMutation.mutateAsync({ plId, documentId, linkRole: role, linkType: "manual" });
      toast.success(`Linked under ${ROLE_LABEL[role]}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to link document.");
    }
  }

  async function handleUnlink(documentId: string) {
    try {
      await unlinkMutation.mutateAsync({ plId, documentId });
      toast.success("Document unlinked.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unlink document.");
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(event: DragEndEvent) {
    const docId = event.active.data.current?.docId as string | undefined;
    const role = event.over?.data.current?.role as LinkRole | undefined;
    if (docId && role) handleLink(docId, role);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div id="pl-document-search" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Search / source panel */}
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold">Search documents to attach</p>
          </div>
          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by document number or title…"
              className="h-8 pr-7 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-1.5">
              {search.trim().length < 1 ? (
                <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">
                  Type to search the document database, then drag a result into a category — or use
                  its “Link” menu.
                </p>
              ) : searchResults.isLoading ? (
                <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">
                  Searching…
                </p>
              ) : (searchResults.data ?? []).length === 0 ? (
                <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">
                  No matching documents found.
                </p>
              ) : (
                (searchResults.data ?? []).map((doc) => (
                  <DraggableSearchResult
                    key={doc.id}
                    doc={doc}
                    alreadyLinked={linkedIds.has(doc.id)}
                    onLink={handleLink}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Role columns */}
        <div className="lg:col-span-2">
          {linkedQuery.isLoading ? (
            <div className="flex h-[200px] items-center justify-center rounded-md border text-xs text-muted-foreground">
              <Link2 className="mr-2 h-4 w-4 animate-pulse" />
              Loading associations…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ROLES.map((role) => (
                <RoleColumn
                  key={role.key}
                  role={role}
                  docs={byRole[role.key]}
                  onUnlink={handleUnlink}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
