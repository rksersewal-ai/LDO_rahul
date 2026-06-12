"use client";

import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
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

interface TagItem {
  id: string;
  name: string;
  color: string;
  description: string | null;
  usageCount: number;
}

export default function TagsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TagItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366F1");
  const [formDescription, setFormDescription] = useState("");

  const { data, isLoading, error, refetch } = trpc.tags.list.useQuery();
  const createMutation = trpc.tags.create.useMutation({ onSuccess: () => { refetch(); closeDialog(); } });
  const updateMutation = trpc.tags.update.useMutation({ onSuccess: () => { refetch(); closeDialog(); } });
  const deleteMutation = trpc.tags.delete.useMutation({ onSuccess: () => refetch() });

  function openCreate() {
    setEditTarget(null);
    setFormName("");
    setFormColor("#6366F1");
    setFormDescription("");
    setDialogOpen(true);
  }

  function openEdit(tag: TagItem) {
    setEditTarget(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormDescription(tag.description ?? "");
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
        color: formColor,
        description: formDescription || undefined,
      });
    } else {
      createMutation.mutate({
        name: formName,
        color: formColor,
        description: formDescription || undefined,
      });
    }
  }

  function handleDelete(tag: TagItem) {
    if (confirm(`Delete tag "${tag.name}"? It will be removed from all documents.`)) {
      deleteMutation.mutate({ id: tag.id });
    }
  }

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Tag Management"
          subtitle="Create and manage tags to categorize documents"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" onClick={openCreate}>
              <Plus className="h-3 w-3" />
              New Tag
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState variant="table" rows={6} />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              Failed to load tags: {error.message}
            </p>
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-5 w-5" />}
            title="No tags yet"
            description="Create your first tag to start categorizing documents"
            actionLabel="Create Tag"
            onAction={openCreate}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((tag) => (
              <Card key={tag.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tag.name}</p>
                    {tag.description && (
                      <p className="truncate text-xs text-muted-foreground">{tag.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge variant="secondary" className="text-xs">
                    {tag.usageCount} doc{tag.usageCount !== 1 ? "s" : ""}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => openEdit(tag)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDelete(tag)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Tag" : "Create Tag"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Tag name"
                maxLength={64}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="tag-color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <span className="text-xs text-muted-foreground">{formColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tag-desc">Description</Label>
              <Textarea
                id="tag-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
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
