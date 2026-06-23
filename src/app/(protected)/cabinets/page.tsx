"use client";

import { ChevronRight, Folder, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

interface CabinetNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  docCount: number;
  children: CabinetNode[];
}

function buildTree(
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    color: string | null;
    icon: string | null;
    docCount: number;
  }>,
): CabinetNode[] {
  const map = new Map<string, CabinetNode>();
  const roots: CabinetNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function CabinetTreeItem({
  node,
  depth,
  onEdit,
  onDelete,
}: {
  node: CabinetNode;
  depth: number;
  onEdit: (node: CabinetNode) => void;
  onDelete: (node: CabinetNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-4 w-4 items-center justify-center text-muted-foreground"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="h-4 w-4" />
        )}
        <Folder className="h-4 w-4 shrink-0" style={{ color: node.color ?? "currentColor" }} />
        <Link
          href={`/cabinets/${node.id}`}
          className="flex-1 truncate text-sm font-medium hover:underline"
        >
          {node.name}
        </Link>
        <span className="text-xs text-muted-foreground">{node.docCount} docs</span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(node)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive"
            onClick={() => onDelete(node)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {expanded &&
        node.children.map((child) => (
          <CabinetTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

export default function CabinetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CabinetNode | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#6366F1");
  const [formParentId, setFormParentId] = useState<string | undefined>(undefined);

  const { data, isLoading, error, refetch } = trpc.cabinets.list.useQuery();
  const createMutation = trpc.cabinets.create.useMutation({
    onSuccess: () => {
      refetch();
      closeDialog();
    },
  });
  const updateMutation = trpc.cabinets.update.useMutation({
    onSuccess: () => {
      refetch();
      closeDialog();
    },
  });
  const deleteMutation = trpc.cabinets.delete.useMutation({ onSuccess: () => refetch() });

  const tree = data ? buildTree(data) : [];

  function openCreate(parentId?: string) {
    setEditTarget(null);
    setFormName("");
    setFormDescription("");
    setFormColor("#6366F1");
    setFormParentId(parentId);
    setDialogOpen(true);
  }

  function openEdit(node: CabinetNode) {
    setEditTarget(node);
    setFormName(node.name);
    setFormDescription(node.description ?? "");
    setFormColor(node.color ?? "#6366F1");
    setFormParentId(undefined);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
  }

  function handleSubmit() {
    if (editTarget) {
      updateMutation.mutate({
        id: editTarget.id,
        name: formName,
        description: formDescription || undefined,
        color: formColor,
      });
    } else {
      createMutation.mutate({
        name: formName,
        description: formDescription || undefined,
        color: formColor,
        parentId: formParentId,
      });
    }
  }

  function handleDelete(node: CabinetNode) {
    if (confirm(`Delete cabinet "${node.name}"? Documents will not be deleted.`)) {
      deleteMutation.mutate({ id: node.id });
    }
  }

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Document Cabinets"
          subtitle="Organize documents into hierarchical folders"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openCreate()}>
              <Plus className="h-3 w-3" />
              New Cabinet
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState variant="table" rows={6} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">Failed to load cabinets: {error.message}</p>
          </div>
        ) : tree.length === 0 ? (
          <EmptyState
            icon={<FolderPlus className="h-5 w-5" />}
            title="No cabinets yet"
            description="Create your first cabinet to start organizing documents"
            actionLabel="Create Cabinet"
            onAction={() => openCreate()}
          />
        ) : (
          <Card className="p-2">
            {tree.map((node) => (
              <CabinetTreeItem
                key={node.id}
                node={node}
                depth={0}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Cabinet" : "Create Cabinet"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cabinet-name">Name</Label>
              <Input
                id="cabinet-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Cabinet name"
                maxLength={128}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cabinet-desc">Description</Label>
              <Textarea
                id="cabinet-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cabinet-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cabinet-color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <span className="text-xs text-muted-foreground">{formColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {editTarget ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
