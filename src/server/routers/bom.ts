import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { detectCycle } from "@/lib/bom/cycle-detection";
import { db } from "@/lib/db";
import { auditLog, bomEntries, bomProducts, plNumbers } from "@/lib/db/schema";
import {
  addEntrySchema,
  createProductSchema,
  linkPlSchema,
  moveEntrySchema,
  updateEntrySchema,
} from "@/lib/validators/bom";
import {
  adminProcedure,
  engineerProcedure,
  protectedProcedure,
  router,
  supervisorProcedure,
} from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user?: { workspaceId?: string | null } } }): string {
  const wsId = ctx.session?.user?.workspaceId;
  if (!wsId) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No workspace assigned" });
  }
  return wsId;
}

/**
 * Escape a CSV field value to prevent injection and preserve structure.
 * Wraps in double quotes if the value contains commas, quotes, newlines,
 * or starts with characters that could trigger formula execution in spreadsheets.
 */
function escapeCsvField(value: string): string {
  if (/[,"\n\r]/.test(value) || /^[=+\-@]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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

    const [newProduct] = await db.select().from(bomProducts).where(eq(bomProducts.id, id));

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

    // Validate parentId exists in the same product
    if (input.parentId) {
      const [parentEntry] = await db
        .select({ id: bomEntries.id })
        .from(bomEntries)
        .where(
          and(eq(bomEntries.id, input.parentId), eq(bomEntries.bomProductId, input.productId)),
        );

      if (!parentEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent entry not found in this product",
        });
      }
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

    // Check PL deprecation/obsolete warning
    if (input.plId) {
      const [pl] = await db.select().from(plNumbers).where(eq(plNumbers.id, input.plId));

      if (pl && (pl.status === "deprecated" || pl.status === "obsolete")) {
        return {
          ...newEntry,
          warning: `PL number ${pl.plNumber} has status ${pl.status} - consider using an active alternative`,
        };
      }
    }

    return newEntry;
  }),

  /** Update entry details */
  updateEntry: engineerProcedure.input(updateEntrySchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Find entry
    const [entry] = await db.select().from(bomEntries).where(eq(bomEntries.id, input.entryId));

    if (!entry) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
    }

    // Verify product belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)));

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

    await db.update(bomEntries).set(updateData).where(eq(bomEntries.id, input.entryId));

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
      const [entry] = await db.select().from(bomEntries).where(eq(bomEntries.id, input.entryId));

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

      // Recursively find all children, delete, and reorder in a transaction
      const toRemove = new Set<string>();
      const result = await db.transaction(async (tx) => {
        const collectDescendants = async (parentId: string) => {
          toRemove.add(parentId);
          const children = await tx
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
          await tx.delete(bomEntries).where(eq(bomEntries.id, id));
        }

        // Reorder remaining siblings
        const parentCondition = entry.parentId
          ? eq(bomEntries.parentId, entry.parentId)
          : sql`${bomEntries.parentId} IS NULL`;

        const remainingSiblings = await tx
          .select()
          .from(bomEntries)
          .where(and(eq(bomEntries.bomProductId, entry.bomProductId), parentCondition))
          .orderBy(asc(bomEntries.position));

        for (let i = 0; i < remainingSiblings.length; i++) {
          await tx
            .update(bomEntries)
            .set({ position: i })
            .where(eq(bomEntries.id, remainingSiblings[i].id));
        }

        return { removed: toRemove.size };
      });

      await createAuditEntry(db, {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        action: "bom.remove_entry",
        resourceType: "bom_entry",
        resourceId: input.entryId,
        details: `Removed ${result.removed} entries (including children)`,
        workspaceId,
      });

      return result;
    }),

  /** Move/reorder entry (drag-and-drop) */
  moveEntry: engineerProcedure.input(moveEntrySchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Find entry
    const [entry] = await db.select().from(bomEntries).where(eq(bomEntries.id, input.entryId));

    if (!entry) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
    }

    // Verify product belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)));

    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }

    // Check not locked
    if (product.lockedAt !== null) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BOM_LOCKED" });
    }

    // Cycle detection: prevent moving an entry under one of its own descendants
    const hasCycle = await detectCycle(entry.bomProductId, input.newParentId, input.entryId, db);
    if (hasCycle) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "BOM_CYCLE_DETECTED: Adding this entry would create a circular reference",
      });
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
    const [entry] = await db.select().from(bomEntries).where(eq(bomEntries.id, input.entryId));

    if (!entry) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
    }

    // Verify product belongs to workspace
    const [product] = await db
      .select()
      .from(bomProducts)
      .where(and(eq(bomProducts.id, entry.bomProductId), eq(bomProducts.workspaceId, workspaceId)));

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

  /** Export BOM as CSV or XLSX */
  exportBom: protectedProcedure
    .input(z.object({ productId: z.string(), format: z.enum(["csv", "xlsx"]) }))
    .mutation(async ({ input, ctx }) => {
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
        .where(eq(bomEntries.bomProductId, input.productId))
        .orderBy(asc(bomEntries.position));

      if (input.format === "csv") {
        const headers =
          "Item Number,Part Name,Part Number,Quantity,Unit,Material,Specification,Drawing Ref,Remarks";
        const rows = entries.map((e) =>
          [
            escapeCsvField(String(e.itemNumber)),
            escapeCsvField(e.partName),
            escapeCsvField(e.partNumber ?? ""),
            escapeCsvField(String(e.quantity)),
            escapeCsvField(e.unit ?? ""),
            escapeCsvField(e.material ?? ""),
            escapeCsvField(e.specification ?? ""),
            escapeCsvField(e.drawingRef ?? ""),
            escapeCsvField(e.remarks ?? ""),
          ].join(","),
        );
        const csv = [headers, ...rows].join("\n");
        const data = Buffer.from(csv, "utf-8").toString("base64");

        return {
          data,
          filename: `${product.productCode}-bom.csv`,
          mimeType: "text/csv" as const,
        };
      }

      // XLSX format
      const sheetData = entries.map((e) => ({
        "Item Number": e.itemNumber,
        "Part Name": e.partName,
        "Part Number": e.partNumber ?? "",
        Quantity: e.quantity,
        Unit: e.unit ?? "",
        Material: e.material ?? "",
        Specification: e.specification ?? "",
        "Drawing Ref": e.drawingRef ?? "",
        Remarks: e.remarks ?? "",
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("BOM");
      if (sheetData.length > 0) {
        worksheet.columns = Object.keys(sheetData[0]).map((key) => ({
          header: key,
          key,
          width: 20,
        }));
        for (const row of sheetData) worksheet.addRow(row);
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const data = Buffer.from(buffer).toString("base64");

      return {
        data,
        filename: `${product.productCode}-bom.xlsx`,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const,
      };
    }),

  /** Clone a BOM product with all entries */
  cloneProduct: engineerProcedure
    .input(z.object({ productId: z.string(), newName: z.string(), newCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      // Verify original product exists in workspace
      const [original] = await db
        .select()
        .from(bomProducts)
        .where(and(eq(bomProducts.id, input.productId), eq(bomProducts.workspaceId, workspaceId)));

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Check newCode uniqueness in workspace
      const [existing] = await db
        .select({ id: bomProducts.id })
        .from(bomProducts)
        .where(
          and(eq(bomProducts.productCode, input.newCode), eq(bomProducts.workspaceId, workspaceId)),
        );

      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Product code already exists" });
      }

      const newProductId = nanoid();
      const now = new Date();

      const result = await db.transaction(async (tx) => {
        // Copy product
        await tx.insert(bomProducts).values({
          id: newProductId,
          productCode: input.newCode,
          name: input.newName,
          description: original.description,
          version: "1.0",
          workspaceId,
          createdBy: ctx.session.user.id,
          approvalStatus: "draft",
          cloneSourceId: input.productId,
          lockedAt: null,
          lockedBy: null,
          createdAt: now,
          updatedAt: now,
        });

        // Get all entries from original product
        const originalEntries = await tx
          .select()
          .from(bomEntries)
          .where(eq(bomEntries.bomProductId, input.productId));

        // Create ID mapping: old ID -> new nanoid
        const idMap = new Map<string, string>();
        for (const entry of originalEntries) {
          idMap.set(entry.id, nanoid());
        }

        // Insert all entries with new IDs, mapping parentId through the ID map
        const newEntries = originalEntries.map((entry) => {
          // biome-ignore lint/style/noNonNullAssertion: every entry.id was inserted into idMap in the prior loop, so get() is always defined
          const newId = idMap.get(entry.id)!;
          const newParentId = entry.parentId ? (idMap.get(entry.parentId) ?? null) : null;

          return {
            id: newId,
            bomProductId: newProductId,
            parentId: newParentId,
            itemNumber: entry.itemNumber,
            partName: entry.partName,
            partNumber: entry.partNumber,
            plNumberId: entry.plNumberId,
            quantity: entry.quantity,
            unit: entry.unit,
            material: entry.material,
            specification: entry.specification,
            drawingRef: entry.drawingRef,
            remarks: entry.remarks,
            position: entry.position,
            type: entry.type,
            effectivityDate: entry.effectivityDate,
            isActive: entry.isActive,
            createdAt: now,
            updatedAt: now,
          };
        });

        if (newEntries.length > 0) {
          await tx.insert(bomEntries).values(newEntries);
        }

        return { entriesCloned: originalEntries.length };
      });

      await createAuditEntry(db, {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        action: "bom.clone_product",
        resourceType: "bom_product",
        resourceId: newProductId,
        resourceTitle: input.newName,
        details: `Cloned from ${original.productCode} with ${result.entriesCloned} entries`,
        workspaceId,
      });

      const [clonedProduct] = await db
        .select()
        .from(bomProducts)
        .where(eq(bomProducts.id, newProductId));

      return clonedProduct;
    }),

  /** Lock a BOM product (supervisor+) */
  lockProduct: supervisorProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [product] = await db
        .select()
        .from(bomProducts)
        .where(and(eq(bomProducts.id, input.productId), eq(bomProducts.workspaceId, workspaceId)));

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await db
        .update(bomProducts)
        .set({
          lockedAt: new Date(),
          lockedBy: ctx.session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(bomProducts.id, input.productId));

      await createAuditEntry(db, {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        action: "bom.lock_product",
        resourceType: "bom_product",
        resourceId: input.productId,
        resourceTitle: product.name,
        workspaceId,
      });

      const [updatedProduct] = await db
        .select()
        .from(bomProducts)
        .where(eq(bomProducts.id, input.productId));

      return updatedProduct;
    }),

  /** Unlock a BOM product (admin only) */
  unlockProduct: adminProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [product] = await db
        .select()
        .from(bomProducts)
        .where(and(eq(bomProducts.id, input.productId), eq(bomProducts.workspaceId, workspaceId)));

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await db
        .update(bomProducts)
        .set({
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(bomProducts.id, input.productId));

      await createAuditEntry(db, {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        action: "bom.unlock_product",
        resourceType: "bom_product",
        resourceId: input.productId,
        resourceTitle: product.name,
        workspaceId,
      });

      const [updatedProduct] = await db
        .select()
        .from(bomProducts)
        .where(eq(bomProducts.id, input.productId));

      return updatedProduct;
    }),

  /** Get version history for a BOM product from audit log */
  getVersionHistory: protectedProcedure
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

      const history = await db
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.entityType, "bom_product"), eq(auditLog.entityId, input.productId)))
        .orderBy(desc(auditLog.createdAt));

      return history;
    }),
});
