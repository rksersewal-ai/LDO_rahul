"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";
import type { BomEntry } from "@/lib/mock-data/bom";
import { BomTreeNode } from "./bom-tree-node";

interface BomTreeProps {
  entries: BomEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (entryId: string, newParentId: string | null, newPosition: number) => void;
  onAddChild: (parentId: string | null) => void;
  onRemove: (entryId: string) => void;
  onLinkPl: (entryId: string) => void;
}

interface TreeNode {
  entry: BomEntry;
  children: TreeNode[];
}

function buildTree(entries: BomEntry[]): TreeNode[] {
  const map = new Map<string | null, BomEntry[]>();
  for (const entry of entries) {
    const parentKey = entry.parentId;
    if (!map.has(parentKey)) {
      map.set(parentKey, []);
    }
    map.get(parentKey)?.push(entry);
  }

  function buildNodes(parentId: string | null): TreeNode[] {
    const children = map.get(parentId) || [];
    return children
      .sort((a, b) => a.position - b.position)
      .map((entry) => ({
        entry,
        children: buildNodes(entry.id),
      }));
  }

  return buildNodes(null);
}

interface FlatNode {
  entry: BomEntry;
  depth: number;
  hasChildren: boolean;
}

function flattenTree(nodes: TreeNode[], expanded: Set<string>, depth = 0): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({
      entry: node.entry,
      depth,
      hasChildren: node.children.length > 0,
    });
    if (expanded.has(node.entry.id) && node.children.length > 0) {
      result.push(...flattenTree(node.children, expanded, depth + 1));
    }
  }
  return result;
}

export function BomTree({
  entries,
  selectedId,
  onSelect,
  onMove,
  onAddChild,
  onRemove,
  onLinkPl,
}: BomTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand root level nodes
    const rootIds = entries.filter((e) => e.parentId === null).map((e) => e.id);
    return new Set(rootIds);
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tree = useMemo(() => buildTree(entries), [entries]);
  const flatNodes = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);
  const sortableIds = useMemo(() => flatNodes.map((n) => n.entry.id), [flatNodes]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeEntry = entries.find((e) => e.id === active.id);
      const overEntry = entries.find((e) => e.id === over.id);
      if (!activeEntry || !overEntry) return;

      // Only reorder within same parent
      if (activeEntry.parentId === overEntry.parentId) {
        onMove(activeEntry.id, activeEntry.parentId, overEntry.position);
      }
    },
    [entries, onMove],
  );

  const activeNode = activeId ? flatNodes.find((n) => n.entry.id === activeId) : null;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-2">No entries in this BOM</p>
        <button
          type="button"
          onClick={() => onAddChild(null)}
          className="text-xs text-primary hover:underline"
        >
          Add first assembly
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="border rounded-md overflow-hidden">
          {flatNodes.map((node) => (
            <BomTreeNode
              key={node.entry.id}
              entry={node.entry}
              depth={node.depth}
              isExpanded={expanded.has(node.entry.id)}
              hasChildren={node.hasChildren}
              isSelected={node.entry.id === selectedId}
              onToggle={() => toggleExpanded(node.entry.id)}
              onSelect={() => onSelect(node.entry.id)}
              onAddChild={() => onAddChild(node.entry.id)}
              onRemove={() => onRemove(node.entry.id)}
              onLinkPl={() => onLinkPl(node.entry.id)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeNode ? (
          <div className="flex items-center h-8 bg-background border rounded shadow-md px-3 text-xs font-medium">
            {activeNode.entry.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
