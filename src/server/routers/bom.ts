import { z } from "zod";
import {
  type BomEntry,
  type BomProduct,
  MOCK_BOM_ENTRIES,
  MOCK_BOM_PRODUCTS,
} from "@/lib/mock-data/bom";
import {
  addEntrySchema,
  createProductSchema,
  linkPlSchema,
  moveEntrySchema,
  updateEntrySchema,
} from "@/lib/validators/bom";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

// In-memory stores
const products: BomProduct[] = [...MOCK_BOM_PRODUCTS];
let entries: BomEntry[] = [...MOCK_BOM_ENTRIES];

export const bomRouter = router({
  /** List all BOM products */
  products: protectedProcedure.query(() => {
    return products.map((p) => ({
      ...p,
      entryCount: entries.filter((e) => e.productId === p.id).length,
    }));
  }),

  /** Get full product with tree entries */
  getProduct: protectedProcedure.input(z.object({ productId: z.string() })).query(({ input }) => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    const productEntries = entries
      .filter((e) => e.productId === input.productId)
      .sort((a, b) => a.position - b.position);
    return { product, entries: productEntries };
  }),

  /** Create a new product */
  createProduct: engineerProcedure.input(createProductSchema).mutation(({ input, ctx }) => {
    // Check code uniqueness
    const existing = products.find((p) => p.code === input.code);
    if (existing) {
      throw new Error("Product code already exists");
    }

    const newProduct: BomProduct = {
      id: `bom-prod-${String(products.length + 1).padStart(3, "0")}`,
      name: input.name,
      code: input.code,
      description: input.description,
      version: "1.0",
      status: "draft",
      category: "locomotive",
      lifecycle: "development",
      createdBy: ctx.session.user?.id || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    return newProduct;
  }),

  /** Add entry to the tree */
  addEntry: engineerProcedure.input(addEntrySchema).mutation(({ input }) => {
    // Validate product exists
    const product = products.find((p) => p.id === input.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Get siblings for position calculation
    const siblings = entries.filter(
      (e) => e.productId === input.productId && e.parentId === (input.parentId || null),
    );
    const position = siblings.length;

    const newEntry: BomEntry = {
      id: `bom-e-${String(entries.length + 1).padStart(3, "0")}`,
      productId: input.productId,
      parentId: input.parentId || null,
      name: input.name,
      type: input.type,
      plId: input.plId || null,
      quantity: input.quantity,
      unit: input.unit,
      material: input.material || null,
      weight: input.weight || null,
      drawingRef: input.drawingRef || null,
      specifications: input.specifications || null,
      vendor: input.vendor || null,
      position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    return newEntry;
  }),

  /** Move/reorder entry (drag-and-drop) */
  moveEntry: engineerProcedure.input(moveEntrySchema).mutation(({ input }) => {
    const entryIndex = entries.findIndex((e) => e.id === input.entryId);
    if (entryIndex === -1) {
      throw new Error("Entry not found");
    }

    const entry = entries[entryIndex];
    const oldParentId = entry.parentId;
    const oldPosition = entry.position;

    // Update the entry parent and position
    entries[entryIndex] = {
      ...entry,
      parentId: input.newParentId,
      position: input.newPosition,
      updatedAt: new Date().toISOString(),
    };

    // Reorder old siblings (fill gap)
    if (oldParentId !== input.newParentId) {
      entries
        .filter(
          (e) =>
            e.productId === entry.productId &&
            e.parentId === oldParentId &&
            e.id !== entry.id &&
            e.position > oldPosition,
        )
        .forEach((e) => {
          e.position -= 1;
        });
    }

    // Reorder new siblings (make room)
    entries
      .filter(
        (e) =>
          e.productId === entry.productId &&
          e.parentId === input.newParentId &&
          e.id !== entry.id &&
          e.position >= input.newPosition,
      )
      .forEach((e) => {
        e.position += 1;
      });

    return entries[entryIndex];
  }),

  /** Update entry details */
  updateEntry: engineerProcedure.input(updateEntrySchema).mutation(({ input }) => {
    const entryIndex = entries.findIndex((e) => e.id === input.entryId);
    if (entryIndex === -1) {
      throw new Error("Entry not found");
    }

    const { entryId, ...updates } = input;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    entries[entryIndex] = {
      ...entries[entryIndex],
      ...filteredUpdates,
      updatedAt: new Date().toISOString(),
    };
    return entries[entryIndex];
  }),

  /** Remove entry and its children */
  removeEntry: engineerProcedure.input(z.object({ entryId: z.string() })).mutation(({ input }) => {
    const entry = entries.find((e) => e.id === input.entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    // Recursively collect all descendant IDs
    const toRemove = new Set<string>();
    const collectDescendants = (parentId: string) => {
      toRemove.add(parentId);
      for (const child of entries.filter((e) => e.parentId === parentId)) {
        collectDescendants(child.id);
      }
    };
    collectDescendants(input.entryId);

    // Remove all collected entries
    entries = entries.filter((e) => !toRemove.has(e.id));

    // Reorder remaining siblings
    entries
      .filter(
        (e) =>
          e.productId === entry.productId &&
          e.parentId === entry.parentId &&
          e.position > entry.position,
      )
      .forEach((e) => {
        e.position -= 1;
      });

    return { removed: toRemove.size };
  }),

  /** Link/unlink PL number to entry */
  linkPL: engineerProcedure.input(linkPlSchema).mutation(({ input }) => {
    const entryIndex = entries.findIndex((e) => e.id === input.entryId);
    if (entryIndex === -1) {
      throw new Error("Entry not found");
    }

    entries[entryIndex] = {
      ...entries[entryIndex],
      plId: input.plId,
      updatedAt: new Date().toISOString(),
    };
    return entries[entryIndex];
  }),
});
