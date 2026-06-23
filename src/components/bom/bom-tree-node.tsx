"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  FolderClosed,
  FolderOpen,
  GripVertical,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { BomEntry } from "@/lib/mock-data/bom";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface BomTreeNodeProps {
  entry: BomEntry;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddChild: () => void;
  onRemove: () => void;
  onLinkPl: () => void;
}

function getTypeIcon(type: BomEntry["type"], isExpanded: boolean) {
  switch (type) {
    case "assembly":
      return isExpanded ? (
        <FolderOpen className="size-3.5 text-amber-600 dark:text-amber-400" />
      ) : (
        <FolderClosed className="size-3.5 text-amber-600 dark:text-amber-400" />
      );
    case "sub_assembly":
      return isExpanded ? (
        <FolderOpen className="size-3.5 text-blue-600 dark:text-blue-400" />
      ) : (
        <FolderClosed className="size-3.5 text-blue-600 dark:text-blue-400" />
      );
    case "component":
      return <Circle className="size-3 text-muted-foreground" />;
  }
}

export function BomTreeNode({
  entry,
  depth,
  isExpanded,
  hasChildren,
  isSelected,
  onToggle,
  onSelect,
  onAddChild,
  onRemove,
  onLinkPl,
}: BomTreeNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    data: { entry, depth },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { data: plData } = trpc.pl.list.useQuery({ pageSize: 100 }, { staleTime: 60_000 });

  const plNumbers = plData?.data ?? [];
  const linkedPl = entry.plId ? plNumbers.find((p) => p.id === entry.plId) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center h-8 border-b border-border/40 text-xs transition-colors",
        isSelected && "bg-accent",
        isDragging && "opacity-50 z-50",
        !isDragging && "hover:bg-accent/50",
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="flex items-center justify-center w-5 h-full cursor-grab opacity-0 group-hover:opacity-60 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3 text-muted-foreground" />
      </button>

      {/* Indent */}
      <div style={{ width: `${depth * 16}px` }} className="shrink-0" />

      {/* Tree lines indicator */}
      {depth > 0 && (
        <div className="relative w-3 h-full shrink-0">
          <div className="absolute top-0 left-1 h-1/2 border-l border-border/60" />
          <div className="absolute top-1/2 left-1 w-2 border-t border-border/60" />
        </div>
      )}

      {/* Expand/Collapse */}
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex items-center justify-center size-5 shrink-0 rounded hover:bg-muted"
        >
          {isExpanded ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className="size-5 shrink-0" />
      )}

      {/* Type Icon */}
      <span className="flex items-center justify-center size-5 shrink-0">
        {getTypeIcon(entry.type, isExpanded)}
      </span>

      {/* Name and content - clickable for selection */}
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 h-full px-1 text-left"
      >
        <span className="truncate font-medium">{entry.name}</span>

        {/* PL Badge */}
        {linkedPl && (
          <Link
            href={`/pl/${linkedPl.id}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {linkedPl.plNumber}
          </Link>
        )}

        {/* Quantity */}
        {entry.quantity > 1 && (
          <span className="shrink-0 inline-flex items-center rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
            x{entry.quantity}
          </span>
        )}
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild();
          }}
          className="flex items-center justify-center size-5 rounded hover:bg-muted"
          title="Add child"
        >
          <Plus className="size-3 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLinkPl();
          }}
          className="flex items-center justify-center size-5 rounded hover:bg-muted"
          title="Link PL"
        >
          <Link2 className="size-3 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex items-center justify-center size-5 rounded hover:bg-destructive/10"
          title="Remove"
        >
          <Trash2 className="size-3 text-destructive" />
        </button>
      </div>
    </div>
  );
}
