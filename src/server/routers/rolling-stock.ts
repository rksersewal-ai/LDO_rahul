import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { bomProducts, rollingStockUnits, workRecords } from "@/lib/db/schema";
import {
  createRollingStockSchema,
  listRollingStockSchema,
  updateRollingStockSchema,
} from "@/lib/validators/rolling-stock";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user: { workspaceId: string | null } } }): string {
  const wsId = ctx.session.user.workspaceId;
  if (!wsId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No workspace assigned. Contact an administrator.",
    });
  }
  return wsId;
}

export const rollingStockRouter = router({
  list: protectedProcedure.input(listRollingStockSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const conditions = [eq(rollingStockUnits.workspaceId, workspaceId)];

    if (input.search) {
      const searchTerm = `%${input.search}%`;
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: or() is only undefined when called with zero conditions; we always pass >=2
        or(
          ilike(rollingStockUnits.unitNumber, searchTerm),
          ilike(rollingStockUnits.serialNumber, searchTerm),
          ilike(rollingStockUnits.homeWorkshop, searchTerm),
          ilike(rollingStockUnits.currentLocation, searchTerm),
        )!,
      );
    }
    if (input.productId) {
      conditions.push(eq(rollingStockUnits.productId, input.productId));
    }
    if (input.status) {
      conditions.push(eq(rollingStockUnits.status, input.status));
    }
    if (input.homeWorkshop) {
      conditions.push(eq(rollingStockUnits.homeWorkshop, input.homeWorkshop));
    }

    const whereClause = and(...conditions);

    const sortColumn = (() => {
      switch (input.sortBy) {
        case "unitNumber":
          return rollingStockUnits.unitNumber;
        case "status":
          return rollingStockUnits.status;
        case "homeWorkshop":
          return rollingStockUnits.homeWorkshop;
        case "createdAt":
          return rollingStockUnits.createdAt;
        case "updatedAt":
          return rollingStockUnits.updatedAt;
        default:
          return rollingStockUnits.unitNumber;
      }
    })();
    const orderFn = input.sortDir === "desc" ? desc : asc;

    const offset = (input.page - 1) * input.pageSize;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(rollingStockUnits)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .offset(offset)
        .limit(input.pageSize),
      db.select({ totalCount: count() }).from(rollingStockUnits).where(whereClause),
    ]);

    return {
      data,
      totalCount: totalResult[0]?.totalCount ?? 0,
      page: input.page,
      pageSize: input.pageSize,
    };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const [unit] = await db
      .select()
      .from(rollingStockUnits)
      .where(
        and(eq(rollingStockUnits.id, input.id), eq(rollingStockUnits.workspaceId, workspaceId)),
      );

    if (!unit) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Rolling stock unit not found" });
    }

    // Fetch linked product if any
    let product = null;
    if (unit.productId) {
      const [p] = await db.select().from(bomProducts).where(eq(bomProducts.id, unit.productId));
      product = p ?? null;
    }

    // Fetch work records for this unit
    const unitWorkRecords = await db
      .select()
      .from(workRecords)
      .where(eq(workRecords.rollingStockUnitId, input.id))
      .orderBy(desc(workRecords.createdAt))
      .limit(50);

    return {
      ...unit,
      product,
      workRecords: unitWorkRecords,
    };
  }),

  listByProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const whereClause = and(
        eq(rollingStockUnits.workspaceId, workspaceId),
        eq(rollingStockUnits.productId, input.productId),
      );

      const offset = (input.page - 1) * input.pageSize;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(rollingStockUnits)
          .where(whereClause)
          .orderBy(asc(rollingStockUnits.unitNumber))
          .offset(offset)
          .limit(input.pageSize),
        db.select({ totalCount: count() }).from(rollingStockUnits).where(whereClause),
      ]);

      return {
        data,
        totalCount: totalResult[0]?.totalCount ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  create: engineerProcedure.input(createRollingStockSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    // Check uniqueness of unit number
    const [existing] = await db
      .select({ id: rollingStockUnits.id })
      .from(rollingStockUnits)
      .where(eq(rollingStockUnits.unitNumber, input.unitNumber));

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Unit number ${input.unitNumber} already exists`,
      });
    }

    // If productId given, verify it exists
    if (input.productId) {
      const [product] = await db
        .select({ id: bomProducts.id })
        .from(bomProducts)
        .where(eq(bomProducts.id, input.productId));
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Linked BOM product not found" });
      }
    }

    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(rollingStockUnits)
      .values({
        id,
        workspaceId,
        productId: input.productId ?? null,
        unitNumber: input.unitNumber,
        serialNumber: input.serialNumber ?? null,
        manufacturedDate: input.manufacturedDate ? new Date(input.manufacturedDate) : null,
        commissioningDate: input.commissioningDate ? new Date(input.commissioningDate) : null,
        status: input.status,
        homeWorkshop: input.homeWorkshop,
        currentLocation: input.currentLocation ?? null,
        notes: input.notes ?? null,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "rollingStock.create",
      resourceType: "rolling_stock_unit",
      resourceId: id,
      resourceTitle: input.unitNumber,
      details: `Created rolling stock unit ${input.unitNumber}`,
      workspaceId,
    });

    return created;
  }),

  update: engineerProcedure.input(updateRollingStockSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const [existing] = await db
      .select()
      .from(rollingStockUnits)
      .where(
        and(eq(rollingStockUnits.id, input.id), eq(rollingStockUnits.workspaceId, workspaceId)),
      );

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Rolling stock unit not found" });
    }

    const { id, ...updates } = input;
    const setValues: Record<string, unknown> = { updatedAt: new Date(), updatedBy: userId };

    if (updates.productId !== undefined) setValues.productId = updates.productId;
    if (updates.unitNumber !== undefined) setValues.unitNumber = updates.unitNumber;
    if (updates.serialNumber !== undefined) setValues.serialNumber = updates.serialNumber;
    if (updates.manufacturedDate !== undefined)
      setValues.manufacturedDate = updates.manufacturedDate
        ? new Date(updates.manufacturedDate)
        : null;
    if (updates.commissioningDate !== undefined)
      setValues.commissioningDate = updates.commissioningDate
        ? new Date(updates.commissioningDate)
        : null;
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.homeWorkshop !== undefined) setValues.homeWorkshop = updates.homeWorkshop;
    if (updates.currentLocation !== undefined) setValues.currentLocation = updates.currentLocation;
    if (updates.notes !== undefined) setValues.notes = updates.notes;

    const [updated] = await db
      .update(rollingStockUnits)
      .set(setValues)
      .where(eq(rollingStockUnits.id, id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "rollingStock.update",
      resourceType: "rolling_stock_unit",
      resourceId: id,
      resourceTitle: existing.unitNumber,
      details: `Updated rolling stock unit ${existing.unitNumber} fields: ${Object.keys(updates).join(", ")}`,
      oldValue: JSON.stringify(
        Object.fromEntries(
          Object.keys(updates).map((k) => [k, (existing as Record<string, unknown>)[k]]),
        ),
      ),
      newValue: JSON.stringify(
        Object.fromEntries(
          Object.keys(updates).map((k) => [k, (updated as Record<string, unknown>)[k]]),
        ),
      ),
      workspaceId,
    });

    return updated;
  }),

  delete: engineerProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const [existing] = await db
      .select()
      .from(rollingStockUnits)
      .where(
        and(eq(rollingStockUnits.id, input.id), eq(rollingStockUnits.workspaceId, workspaceId)),
      );

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Rolling stock unit not found" });
    }

    // Check if any work records are linked
    const linkedRecords = await db
      .select({ id: workRecords.id })
      .from(workRecords)
      .where(eq(workRecords.rollingStockUnitId, input.id))
      .limit(1);

    if (linkedRecords.length > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete unit with linked work records. Unlink or reassign them first.",
      });
    }

    await db.delete(rollingStockUnits).where(eq(rollingStockUnits.id, input.id));

    await createAuditEntry(db, {
      userId,
      userName,
      action: "rollingStock.delete",
      resourceType: "rolling_stock_unit",
      resourceId: input.id,
      resourceTitle: existing.unitNumber,
      details: `Deleted rolling stock unit ${existing.unitNumber}`,
      workspaceId,
    });

    return { success: true };
  }),
});
