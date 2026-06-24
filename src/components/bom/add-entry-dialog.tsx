"use client";

import { useState } from "react";
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
import type { BomEntry, BomEntryType } from "@/lib/mock-data/bom";
import { trpc } from "@/lib/trpc/client";

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentEntry: BomEntry | null;
  onSubmit: (data: {
    name: string;
    type: BomEntryType;
    plId: string | null;
    quantity: number;
    unit: string;
    material: string | null;
    weight: number | null;
    drawingRef: string | null;
  }) => void;
}

export function AddEntryDialog({ open, onOpenChange, parentEntry, onSubmit }: AddEntryDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BomEntryType>("component");
  const [plSearch, setPlSearch] = useState("");
  const [selectedPlId, setSelectedPlId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("nos");
  const [material, setMaterial] = useState("");
  const [weight, setWeight] = useState("");
  const [drawingRef, setDrawingRef] = useState("");
  const [showPlResults, setShowPlResults] = useState(false);

  const { data: plData } = trpc.pl.list.useQuery({ pageSize: 100 }, { staleTime: 60_000 });

  const plNumbers = plData?.data ?? [];

  const plResults =
    plSearch.length >= 2
      ? plNumbers
          .filter(
            (p) =>
              p.plNumber.includes(plSearch) ||
              p.name.toLowerCase().includes(plSearch.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  const selectedPl = selectedPlId ? plNumbers.find((p) => p.id === selectedPlId) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      type,
      plId: selectedPlId,
      quantity: Number.parseInt(quantity, 10) || 1,
      unit: unit.trim() || "nos",
      material: material.trim() || null,
      weight: weight ? Number.parseFloat(weight) : null,
      drawingRef: drawingRef.trim() || null,
    });

    // Reset form
    setName("");
    setType("component");
    setPlSearch("");
    setSelectedPlId(null);
    setQuantity("1");
    setUnit("nos");
    setMaterial("");
    setWeight("");
    setDrawingRef("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add BOM Entry</DialogTitle>
          <DialogDescription>
            {parentEntry ? `Adding child to: ${parentEntry.name}` : "Adding root-level entry"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-name" className="text-xs">
              Name *
            </Label>
            <Input
              id="entry-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Traction Motor Assembly"
              className="h-8 text-xs"
              required
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-type" className="text-xs">
              Type *
            </Label>
            <select
              id="entry-type"
              value={type}
              onChange={(e) => setType(e.target.value as BomEntryType)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="assembly">Assembly</option>
              <option value="sub_assembly">Sub-Assembly</option>
              <option value="component">Component</option>
            </select>
          </div>

          {/* PL Number Search */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pl-search" className="text-xs">
              PL Number (optional)
            </Label>
            {selectedPl ? (
              <div className="flex items-center gap-2 h-8 rounded-md border px-2">
                <span className="text-xs font-mono font-medium text-primary">
                  {selectedPl.plNumber}
                </span>
                <span className="text-xs text-muted-foreground truncate">{selectedPl.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlId(null);
                    setPlSearch("");
                  }}
                  className="ml-auto text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="pl-search"
                  value={plSearch}
                  onChange={(e) => {
                    setPlSearch(e.target.value);
                    setShowPlResults(true);
                  }}
                  onFocus={() => setShowPlResults(true)}
                  onBlur={() => setTimeout(() => setShowPlResults(false), 200)}
                  placeholder="Search PL number or name..."
                  className="h-8 text-xs"
                />
                {showPlResults && plResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-1 shadow-md">
                    {plResults.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlId(pl.id);
                          setPlSearch("");
                          setShowPlResults(false);
                        }}
                        className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-left hover:bg-accent"
                      >
                        <span className="text-xs font-mono font-medium">{pl.plNumber}</span>
                        <span className="text-xs text-muted-foreground truncate">{pl.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-qty" className="text-xs">
                Quantity *
              </Label>
              <Input
                id="entry-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-unit" className="text-xs">
                Unit *
              </Label>
              <Input
                id="entry-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-8 text-xs"
                placeholder="nos"
              />
            </div>
          </div>

          {/* Material */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-material" className="text-xs">
              Material
            </Label>
            <Input
              id="entry-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g., Steel/Copper"
              className="h-8 text-xs"
            />
          </div>

          {/* Weight & Drawing Ref */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-weight" className="text-xs">
                Weight (kg)
              </Label>
              <Input
                id="entry-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-8 text-xs"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-drawing" className="text-xs">
                Drawing Ref
              </Label>
              <Input
                id="entry-drawing"
                value={drawingRef}
                onChange={(e) => setDrawingRef(e.target.value)}
                className="h-8 text-xs"
                placeholder="CLW/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" size="sm" className="h-8 text-xs">
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
