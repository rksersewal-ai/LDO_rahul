"use client";

import { ArrowLeft, Download, Plus } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useMemo, useState } from "react";
import { AddEntryDialog } from "@/components/bom/add-entry-dialog";
import { BomNodeDetail } from "@/components/bom/bom-node-detail";
import { BomTree } from "@/components/bom/bom-tree";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { type BomEntry, MOCK_BOM_ENTRIES, MOCK_BOM_PRODUCTS } from "@/lib/mock-data/bom";
import { MOCK_PL_NUMBERS } from "@/lib/mock-data/pl-numbers";

function mapProductStatus(status: string): StatusType {
  switch (status) {
    case "active":
      return "done";
    case "draft":
      return "pending";
    case "deprecated":
      return "failed";
    default:
      return "pending";
  }
}

export default function ProductBomPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const product = MOCK_BOM_PRODUCTS.find((p) => p.id === productId);

  const [entries, setEntries] = useState<BomEntry[]>(() =>
    MOCK_BOM_ENTRIES.filter((e) => e.productId === productId),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [linkPlDialogOpen, setLinkPlDialogOpen] = useState(false);
  const [linkPlEntryId, setLinkPlEntryId] = useState<string | null>(null);
  const [plSearch, setPlSearch] = useState("");

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedId) || null,
    [entries, selectedId],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleMove = useCallback(
    (entryId: string, newParentId: string | null, newPosition: number) => {
      setEntries((prev) => {
        const entryIndex = prev.findIndex((e) => e.id === entryId);
        if (entryIndex === -1) return prev;

        const entry = prev[entryIndex];
        const updated = [...prev];

        // Update the moved entry
        updated[entryIndex] = { ...entry, parentId: newParentId, position: newPosition };

        // Reorder siblings
        const siblings = updated.filter((e) => e.parentId === newParentId && e.id !== entryId);
        for (const sibling of siblings) {
          const idx = updated.findIndex((e) => e.id === sibling.id);
          if (sibling.position >= newPosition) {
            updated[idx] = { ...sibling, position: sibling.position + 1 };
          }
        }

        return updated;
      });
    },
    [],
  );

  const handleAddChild = useCallback((parentId: string | null) => {
    setAddParentId(parentId);
    setAddDialogOpen(true);
  }, []);

  const handleRemove = useCallback((entryId: string) => {
    setEntries((prev) => {
      const toRemove = new Set<string>();
      const collectDescendants = (id: string) => {
        toRemove.add(id);
        for (const child of prev.filter((e) => e.parentId === id)) {
          collectDescendants(child.id);
        }
      };
      collectDescendants(entryId);
      return prev.filter((e) => !toRemove.has(e.id));
    });
    setSelectedId((prev) => (prev === entryId ? null : prev));
  }, []);

  const handleLinkPl = useCallback((entryId: string) => {
    setLinkPlEntryId(entryId);
    setPlSearch("");
    setLinkPlDialogOpen(true);
  }, []);

  const handleAddEntry = useCallback(
    (data: {
      name: string;
      type: BomEntry["type"];
      plId: string | null;
      quantity: number;
      unit: string;
      material: string | null;
      weight: number | null;
      drawingRef: string | null;
    }) => {
      const siblings = entries.filter((e) => e.parentId === addParentId);
      const newEntry: BomEntry = {
        id: `bom-e-new-${Date.now()}`,
        productId,
        parentId: addParentId,
        name: data.name,
        type: data.type,
        plId: data.plId,
        quantity: data.quantity,
        unit: data.unit,
        material: data.material,
        weight: data.weight,
        drawingRef: data.drawingRef,
        specifications: null,
        vendor: null,
        position: siblings.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, newEntry]);
    },
    [entries, addParentId, productId],
  );

  const handleSelectPl = useCallback(
    (plId: string | null) => {
      if (!linkPlEntryId) return;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === linkPlEntryId ? { ...e, plId, updatedAt: new Date().toISOString() } : e,
        ),
      );
      setLinkPlDialogOpen(false);
      setLinkPlEntryId(null);
    },
    [linkPlEntryId],
  );

  const plResults =
    plSearch.length >= 2
      ? MOCK_PL_NUMBERS.filter(
          (p) =>
            p.plNumber.includes(plSearch) || p.name.toLowerCase().includes(plSearch.toLowerCase()),
        ).slice(0, 8)
      : [];

  if (!product) {
    return (
      <PageFrame>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-sm text-muted-foreground">Product not found</p>
          <Button variant="outline" size="sm" render={<Link href="/bom" />}>
            Back to BOM Explorer
          </Button>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href="/bom" />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to BOM Explorer
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold truncate">{product.name}</h1>
            <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
              v{product.version}
            </Badge>
            <StatusBadge status={mapProductStatus(product.status)} label={product.status} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => handleAddChild(null)}
            >
              <Plus className="h-3 w-3" />
              Add Root Entry
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>
        </div>

        {/* Split View: Tree + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[500px]">
          {/* Left: Tree */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/30 rounded-t-md">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Structure Tree
              </span>
              <span className="text-[10px] text-muted-foreground">{entries.length} entries</span>
            </div>
            <div className="flex-1 overflow-auto">
              <BomTree
                entries={entries}
                selectedId={selectedId}
                onSelect={handleSelect}
                onMove={handleMove}
                onAddChild={handleAddChild}
                onRemove={handleRemove}
                onLinkPl={handleLinkPl}
              />
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="border rounded-md overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/30">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Node Details
              </span>
            </div>
            <div className="p-3 overflow-auto max-h-[600px]">
              {selectedEntry ? (
                <BomNodeDetail entry={selectedEntry} onLinkPl={handleLinkPl} />
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Select a node to view details
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <AddEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parentEntry={entries.find((e) => e.id === addParentId) || null}
        onSubmit={handleAddEntry}
      />

      {/* Link PL Dialog */}
      <Dialog open={linkPlDialogOpen} onOpenChange={setLinkPlDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Link PL Number</DialogTitle>
            <DialogDescription>
              Search and select a PL number to link to this entry
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-pl-search" className="text-xs">
                Search PL Number
              </Label>
              <Input
                id="link-pl-search"
                value={plSearch}
                onChange={(e) => setPlSearch(e.target.value)}
                placeholder="Type PL number or name..."
                className="h-8 text-xs"
              />
            </div>
            {plResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-auto">
                {plResults.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => handleSelectPl(pl.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent border-b last:border-b-0"
                  >
                    <span className="text-xs font-mono font-medium">{pl.plNumber}</span>
                    <span className="text-xs text-muted-foreground truncate">{pl.name}</span>
                  </button>
                ))}
              </div>
            )}
            {plSearch.length >= 2 && plResults.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No results found</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSelectPl(null)}
            >
              Remove Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
