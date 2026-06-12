import { TRPCError } from "@trpc/server";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { bomEntries, bomProducts, plNumbers } from "@/lib/db/schema";
import {
  addEntrySchema,
  createProductSchema,
  linkPlSchema,
  moveEntrySchema,
  updateEntrySchema,
} from "@/lib/validators/bom";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user?: { workspaceId?: string | null } } }): string {
  const wsId = ctx.session?.user?.workspaceId;
  if (!wsId) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No workspace assigned" });
  }
  return wsId;
}

export const bomRouter = router({
  /** List all BOM products with entry counts */
  products: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const products = await db
      .select()
      .from(bomProducts)
      .where(eq(bomProducts.workspaceId, workspaceId));

    const results = await Promise.all(
      products.map(async (product) => {
        const [countResult] = await db
          .select({ count: count() })
          .from(bomEntries)
          .where(eq(bomEntries.bomProductId, product.id));
        return { ...product, entryCount: countResult?.count ?? 0 };
      }),
    );

    return results;
  }),

  /** Get full product with tree entries */
  getProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [product] = await db
        .select()
        .from(bomProducts)
        .where(and(eq(bomProducts.id, input.productId), eq(bomProducts.workspaceId, workspaceId)));

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const entries = await db
        .select()
        .from(bomEntries)
        .where(eq(bomEntries.bomProductId, product.id))
        .orderBy(asc(bomEntries.position));

      return { product, entries };
    }),

  /** Create a new product */
  createProduct: engineerProcedure.input(createProductSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Check code uniqueness within workspace
    const [existing] = await db
      .select({ id: bomProducts.id })
      .from(bomProducts)
      .where(
        and(eq(bomProducts.productCode, input.code), eq(bomProducts.workspaceId, workspaceId)),
      );

    if (existing) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Product code already exists" });
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(bomProducts).values({
      id,
      productCode: input.code,
      name: input.name,
      description: input.description,
      version: "1.0",
      workspaceId,
      createdBy: ctx.session.user.id,
      approvalStatus: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await createAuditEntry(db, {
      userId: ctx.session.user.id,
      userName: ctx.session.user.name ?? "Unknown",
      action: "bom.create_product",
      resourceType: "bom_product",
      resourceId: id,
      resourceTitle: input.name,
      workspaceId,
    });

    const [newProduct] = await db
      .select()
      .from(bomProducts)
      .where(eq(bomProducts.id, id));

    return newProduct;
  }),

  /** Add entry to the tree */
  addEntry: engineerProcedure.input(addEntrySchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Verify product exists and belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(and(eq(bomProducts.id, input.productId), eq(bomProducts.workspaceId, workspaceId)));

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Check product not locked
    if (product.lockedAt !== null) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BOM_LOCKED" });
    }

    // Compute next position among siblings
    const parentCondition = input.parentId
      ? eq(bomEntries.parentId, input.parentId)
      : sql`${bomEntries.parentId} IS NULL`;

    const [positionResult] = await db
      .select({ count: count() })
      .from(bomEntries)
      .where(and(eq(bomEntries.bomProductId, input.productId), parentCondition));

    const position = positionResult?.count ?? 0;
    const id = nanoid();
    const now = new Date();

    await db.insert(bomEntries).values({
      id,
      bomProductId: input.productId,
      parentId: input.parentId || null,
      itemNumber: position + 1,
      partName: input.name,
      type: input.type,
      plNumberId: input.plId || null,
      quantity: input.quantity,
      unit: input.unit,
      material: input.material || null,
      specification: input.specifications || null,
      drawingRef: input.drawingRef || null,
      position,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await createAuditEntry(db, {
      userId: ctx.session.user.id,
      userName: ctx.session.user.name ?? "Unknown",
      action: "bom.add_entry",
      resourceType: "bom_entry",
      resourceId: id,
      resourceTitle: input.name,
      workspaceId,
    });

    const [newEntry] = await db.select().from(bomEntries).where(eq(bomEntries.id, id));

    return newEntry;
  }),

  /** Update entry details */
  updateEntry: engineerProcedure.input(updateEntrySchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Find entry
    const [entry] = await db
      .select()
      .from(bomEntries)
      .where(eq(bomEntries.id, input.entryId));

    if (!entry) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
    }

    // Verify product belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(
        and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)),
      );

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Check not locked
    if (product.lockedAt !== null) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BOM_LOCKED" });
    }

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.partName = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;
    if (input.unit !== undefined) updateData.unit = input.unit;
    if (input.material !== undefined) updateData.material = input.material;
    if (input.drawingRef !== undefined) updateData.drawingRef = input.drawingRef;
    if (input.specifications !== undefined) updateData.specification = input.specifications;

    await db
      .update(bomEntries)
      .set(updateData)
      .where(eq(bomEntries.id, input.entryId));

    await createAuditEntry(db, {
      userId: ctx.session.user.id,
      userName: ctx.session.user.name ?? "Unknown",
      action: "bom.update_entry",
      resourceType: "bom_entry",
      resourceId: input.entryId,
      workspaceId,
    });

    const [updatedEntry] = await db
      .select()
      .from(bomEntries)
      .where(eq(bomEntries.id, input.entryId));

    return updatedEntry;
  }),

  /** Remove entry and its children */
  removeEntry: engineerProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Find entry
      const [entry] = await db
        .select()
        .from(bomEntries)
        .where(eq(bomEntries.id, input.entryId));

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      // Verify product belongs to workspace
      const [product] = await db
        .select()
        .from(bomProducts)
        .where(
          and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)),
        );

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Check not locked
      if (product.lockedAt !== null) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BOM_LOCKED" });
      }

      // Recursively find all children
      const toRemove = new Set<string>();
      const collectDescendants = async (parentId: string) => {
        toRemove.add(parentId);
        const children = await db
          .select({ id: bomEntries.id })
          .from(bomEntries)
          .where(eq(bomEntries.parentId, parentId));
        for (const child of children) {
          await collectDescendants(child.id);
        }
      };
      await collectDescendants(input.entryId);

      // Delete all collected entries
      for (const id of toRemove) {
        await db.delete(bomEntries).where(eq(bomEntries.id, id));
      }

      // Reorder remaining siblings
      const parentCondition = entry.parentId
        ? eq(bomEntries.parentId, entry.parentId)
        : sql`${bomEntries.parentId} IS NULL`;

      const remainingSiblings = await db
        .select()
        .from(bomEntries)
        .where(
          and(
            eq(bomEntries.bomProductId, entry.bomProductId),
            parentCondition,
          ),
        )
        .orderBy(asc(bomEntries.position));

      for (let i = 0; i < remainingSiblings.length; i++) {
        await db
          .update(bomEntries)
          .set({ position: i })
          .where(eq(bomEntries.id, remainingSiblings[i].id));
      }

      await createAuditEntry(db, {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        action: "bom.remove_entry",
        resourceType: "bom_entry",
        resourceId: input.entryId,
        details: `Removed ${toRemove.size} entries (including children)`,
        workspaceId,
      });

      return { removed: toRemove.size };
    }),

  /** Move/reorder entry (drag-and-drop) */
  moveEntry: engineerProcedure.input(moveEntrySchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Find entry
    const [entry] = await db
      .select()
      .from(bomEntries)
      .where(eq(bomEntries.id, input.entryId));

    if (!entry) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
    }

    // Verify product belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(
        and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)),
      );

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Check not locked
    if (product.lockedAt !== null) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BOM_LOCKED" });
    }

    // Update entry parent and position
    await db
      .update(bomEntries)
      .set({
        parentId: input.newParentId,
        position: input.newPosition,
        updatedAt: new Date(),
      })
      .where(eq(bomEntries.id, input.entryId));

    await createAuditEntry(db, {
      userId: ctx.session.user.id,
      userName: ctx.session.user.name ?? "Unknown",
      action: "bom.move_entry",
      resourceType: "bom_entry",
      resourceId: input.entryId,
      workspaceId,
    });

    const [updatedEntry] = await db
      .select()
      .from(bomEntries)
      .where(eq(bomEntries.id, input.entryId));

    return updatedEntry;
  }),

  /** Link/unlink PL number to entry */
  linkPL: engineerProcedure.input(linkPlSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Find entry
    const [entry] = await db
      .select()
      .from(bomEntries)
      .where(eq(bomEntries.id, input.entryId));

    if (!entry) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
    }

    // Verify product belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(
        and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)),
      );

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Check not locked
    if (product.lockedAt !== null) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BOM_LOCKED" });
    }

    // Update plNumberId
    await db
      .update(bomEntries)
      .set({
        plNumberId: input.plId,
        updatedAt: new Date(),
      })
      .where(eq(bomEntries.id, input.entryId));

    await createAuditEntry(db, {
      userId: ctx.session.user.id,
      userName: ctx.session.user.name ?? "Unknown",
      action: "bom.link_pl",
      resourceType: "bom_entry",
      resourceId: input.entryId,
      workspaceId,
    });

    const [updatedEntry] = await db
      .select()
      .from(bomEntries)
      .where(eq(bomEntries.id, input.entryId));

    return updatedEntry;
  }),
});
