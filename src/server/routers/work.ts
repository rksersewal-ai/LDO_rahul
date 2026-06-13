import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, ilike, lte, or, sql, asc } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { workRecords } from "@/lib/db/schema";
import { sanitizeUserInput } from "@/lib/security/sanitize";
import {
  createWorkRecordSchema,
  getKPIsSchema,
  lockWorkRecordSchema,
  submitWorkRecordSchema,
  updateWorkRecordSchema,
  verifyWorkRecordSchema,
  workRecordListSchema,
} from "@/lib/validators/work-records";
import { engineerProcedure, protectedProcedure, router, supervisorProcedure } from "@/server/trpc";

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

export const workRouter = router({
  list: protectedProcedure.input(workRecordListSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);

    const conditions = [eq(workRecords.workspaceId, workspaceId)];

    if (input.search) {
      conditions.push(
        or(
          ilike(workRecords.title, `%${input.search}%`),
          ilike(workRecords.workOrderNumber, `%${input.search}%`),
          ilike(workRecords.description, `%${input.search}%`),
        )!,
      );
    }

    if (input.status) {
      const statusMap: Record<string, string> = {
        OPEN: "open",
        SUBMITTED: "in_progress",
        VERIFIED: "completed",
        CLOSED: "completed",
      };
      const mappedStatus = statusMap[input.status] ?? input.status.toLowerCase();
      conditions.push(eq(workRecords.status, mappedStatus as "open" | "in_progress" | "completed" | "on_hold" | "cancelled"));
    }

    if (input.priority) {
      conditions.push(eq(workRecords.priority, input.priority.toLowerCase()));
    }

    if (input.userId) {
      conditions.push(
        or(
          eq(workRecords.assignedTo, input.userId),
          eq(workRecords.createdBy, input.userId),
        )!,
      );
    }

    if (input.dateFrom) {
      conditions.push(gte(workRecords.createdAt, new Date(input.dateFrom)));
    }

    if (input.dateTo) {
      conditions.push(lte(workRecords.createdAt, new Date(input.dateTo)));
    }

    const whereClause = and(...conditions);

    const sortColumnMap: Record<string, typeof workRecords.createdAt> = {
      createdAt: workRecords.createdAt,
      date: workRecords.createdAt,
      status: workRecords.status as never,
      priority: workRecords.priority as never,
    };

    const sortCol = sortColumnMap[input.sortBy] ?? workRecords.createdAt;
    const orderFn = input.sortOrder === "asc" ? asc : desc;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(workRecords)
        .where(whereClause)
        .orderBy(orderFn(sortCol))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ total: count() })
        .from(workRecords)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.total ?? 0,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);

    const [record] = await db
      .select()
      .from(workRecords)
      .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)));

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }

    return record;
  }),

  create: engineerProcedure.input(createWorkRecordSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Idempotency check
    if (input.clientMutationId) {
      const [existing] = await db
        .select()
        .from(workRecords)
        .where(eq(workRecords.clientMutationId, input.clientMutationId));

      if (existing) {
        return existing;
      }
    }

    const id = randomUUID();
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${id.slice(0, 4).toUpperCase()}`;

    const [record] = await db
      .insert(workRecords)
      .values({
        id,
        workOrderNumber,
        title: `${input.workCategory} - ${input.workTypeCode}`,
        description: input.description ? sanitizeUserInput(input.description) : input.description,
        priority: input.priority?.toLowerCase() ?? "medium",
        status: "open",
        createdBy: userId,
        updatedBy: userId,
        workspaceId,
        clientMutationId: input.clientMutationId ?? null,
        clientDeviceId: input.clientDeviceId ?? null,
        syncStatus: "synced",
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "work_record.create",
      resourceType: "work_record",
      resourceId: id,
      resourceTitle: record.title,
      workspaceId,
    });

    return record;
  }),

  update: engineerProcedure.input(updateWorkRecordSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const [current] = await db
      .select()
      .from(workRecords)
      .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)));

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }

    // Conflict detection
    if (input.expectedUpdatedAt) {
      const expectedDate = new Date(input.expectedUpdatedAt);
      if (current.updatedAt > expectedDate) {
        // Mark as conflict
        await db
          .update(workRecords)
          .set({
            syncStatus: "conflict",
            conflictPayload: JSON.stringify(current),
          })
          .where(eq(workRecords.id, input.id));

        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "CONFLICT: Record was modified on the server since your last sync.",
          cause: { serverVersion: current },
        });
      }
    }

    const updateData: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (input.description !== undefined) updateData.description = input.description ? sanitizeUserInput(input.description) : input.description;
    if (input.priority !== undefined) updateData.priority = input.priority.toLowerCase();
    if (input.remarks !== undefined) updateData.disposalNotes = input.remarks;

    const [updated] = await db
      .update(workRecords)
      .set(updateData)
      .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "work_record.update",
      resourceType: "work_record",
      resourceId: input.id,
      resourceTitle: updated.title,
      oldValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      workspaceId,
    });

    return updated;
  }),

  submit: engineerProcedure.input(submitWorkRecordSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const [current] = await db
      .select()
      .from(workRecords)
      .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)));

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }

    if (current.status !== "open") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only open records can be submitted",
      });
    }

    const [updated] = await db
      .update(workRecords)
      .set({ status: "in_progress", updatedBy: userId, updatedAt: new Date() })
      .where(eq(workRecords.id, input.id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "work_record.submit",
      resourceType: "work_record",
      resourceId: input.id,
      resourceTitle: updated.title,
      workspaceId,
    });

    return updated;
  }),

  verify: supervisorProcedure.input(verifyWorkRecordSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const [current] = await db
      .select()
      .from(workRecords)
      .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)));

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }

    if (current.status !== "in_progress") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only in-progress records can be verified",
      });
    }

    const newStatus = input.action === "verify" ? "completed" : "open";

    const [updated] = await db
      .update(workRecords)
      .set({
        status: newStatus as "open" | "completed",
        completedAt: input.action === "verify" ? new Date() : null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(workRecords.id, input.id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: `work_record.${input.action}`,
      resourceType: "work_record",
      resourceId: input.id,
      resourceTitle: updated.title,
      details: input.remarks ?? undefined,
      workspaceId,
    });

    return updated;
  }),

  lock: supervisorProcedure.input(lockWorkRecordSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const [current] = await db
      .select()
      .from(workRecords)
      .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)));

    if (!current) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }

    const [updated] = await db
      .update(workRecords)
      .set({ status: "on_hold", updatedBy: userId, updatedAt: new Date() })
      .where(eq(workRecords.id, input.id))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "work_record.lock",
      resourceType: "work_record",
      resourceId: input.id,
      resourceTitle: updated.title,
      workspaceId,
    });

    return updated;
  }),

  assignWork: supervisorProcedure
    .input(
      z.object({
        workRecordId: z.string(),
        assignToUserId: z.string(),
        assignToUserName: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx as never);
      const userId = ctx.session.user?.id ?? "unknown";
      const userName = ctx.session.user?.name ?? "Unknown User";

      const [current] = await db
        .select()
        .from(workRecords)
        .where(and(eq(workRecords.id, input.workRecordId), eq(workRecords.workspaceId, workspaceId)));

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
      }

      if (current.status !== "open") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot assign work record - it may not be in open status",
        });
      }

      const [updated] = await db
        .update(workRecords)
        .set({
          assignedTo: input.assignToUserId,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(workRecords.id, input.workRecordId))
        .returning();

      await createAuditEntry(db, {
        userId,
        userName,
        action: "work_record.assign",
        resourceType: "work_record",
        resourceId: input.workRecordId,
        resourceTitle: updated.title,
        details: `Assigned to ${input.assignToUserName}`,
        workspaceId,
      });

      return updated;
    }),

  getMyPendingWorks: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "";

    const records = await db
      .select()
      .from(workRecords)
      .where(
        and(
          eq(workRecords.workspaceId, workspaceId),
          or(
            eq(workRecords.assignedTo, userId),
            eq(workRecords.createdBy, userId),
          ),
          or(
            eq(workRecords.status, "open"),
            eq(workRecords.status, "in_progress"),
          ),
        ),
      )
      .orderBy(asc(workRecords.priority), desc(workRecords.createdAt));

    return records;
  }),

  getUserProductivity: supervisorProcedure
    .input(
      z
        .object({
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx as never);

      const conditions = [eq(workRecords.workspaceId, workspaceId)];

      if (input?.dateFrom) {
        conditions.push(gte(workRecords.createdAt, new Date(input.dateFrom)));
      }
      if (input?.dateTo) {
        conditions.push(lte(workRecords.createdAt, new Date(input.dateTo)));
      }

      const whereClause = and(...conditions);

      const results = await db
        .select({
          userId: workRecords.createdBy,
          totalRecords: count(),
          completedRecords: sql<number>`count(*) filter (where ${workRecords.status} = 'completed')`,
        })
        .from(workRecords)
        .where(whereClause)
        .groupBy(workRecords.createdBy);

      return results.map((r) => ({
        userId: r.userId ?? "unknown",
        userName: r.userId ?? "Unknown",
        totalRecords: r.totalRecords,
        completedRecords: Number(r.completedRecords),
        onTimePercentage: r.totalRecords > 0 ? Math.round((Number(r.completedRecords) / r.totalRecords) * 100) : 0,
      }));
    }),

  getKPIs: protectedProcedure.input(getKPIsSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);

    const conditions = [eq(workRecords.workspaceId, workspaceId)];

    if (input.userId) {
      conditions.push(
        or(
          eq(workRecords.assignedTo, input.userId),
          eq(workRecords.createdBy, input.userId),
        )!,
      );
    }
    if (input.dateFrom) {
      conditions.push(gte(workRecords.createdAt, new Date(input.dateFrom)));
    }
    if (input.dateTo) {
      conditions.push(lte(workRecords.createdAt, new Date(input.dateTo)));
    }

    const whereClause = and(...conditions);

    const [stats] = await db
      .select({
        total: count(),
        open: sql<number>`count(*) filter (where ${workRecords.status} = 'open')`,
        inProgress: sql<number>`count(*) filter (where ${workRecords.status} = 'in_progress')`,
        completed: sql<number>`count(*) filter (where ${workRecords.status} = 'completed')`,
        onHold: sql<number>`count(*) filter (where ${workRecords.status} = 'on_hold')`,
        cancelled: sql<number>`count(*) filter (where ${workRecords.status} = 'cancelled')`,
        avgCompletionDays: sql<number>`coalesce(avg(extract(epoch from (${workRecords.completedAt} - ${workRecords.createdAt})) / 86400) filter (where ${workRecords.completedAt} is not null), 0)`,
      })
      .from(workRecords)
      .where(whereClause);

    return {
      total: stats?.total ?? 0,
      open: Number(stats?.open ?? 0),
      inProgress: Number(stats?.inProgress ?? 0),
      completed: Number(stats?.completed ?? 0),
      onHold: Number(stats?.onHold ?? 0),
      cancelled: Number(stats?.cancelled ?? 0),
      avgCompletionDays: Math.round(Number(stats?.avgCompletionDays ?? 0)),
    };
  }),

  resolveConflict: engineerProcedure
    .input(
      z.object({
        id: z.string(),
        resolution: z.enum(["keep_client", "keep_server"]),
        clientPayload: z
          .object({
            title: z.string().max(512).optional(),
            description: z.string().max(10000).optional(),
            priority: z.string().max(16).optional(),
            section: z.string().max(128).optional(),
            workshop: z.string().max(128).optional(),
            locoNumber: z.string().max(32).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx as never);
      const userId = ctx.session.user?.id ?? "unknown";
      const userName = ctx.session.user?.name ?? "Unknown User";

      const [current] = await db
        .select()
        .from(workRecords)
        .where(and(eq(workRecords.id, input.id), eq(workRecords.workspaceId, workspaceId)));

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
      }

      if (current.syncStatus !== "conflict") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Record is not in conflict state",
        });
      }

      const updateData: Record<string, unknown> = {
        syncStatus: "synced",
        conflictPayload: null,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      if (input.resolution === "keep_client" && input.clientPayload) {
        // Apply validated fields from clientPayload
        if (input.clientPayload.title !== undefined) updateData.title = input.clientPayload.title;
        if (input.clientPayload.description !== undefined) updateData.description = input.clientPayload.description;
        if (input.clientPayload.priority !== undefined) updateData.priority = input.clientPayload.priority;
        if (input.clientPayload.section !== undefined) updateData.section = input.clientPayload.section;
        if (input.clientPayload.workshop !== undefined) updateData.workshop = input.clientPayload.workshop;
        if (input.clientPayload.locoNumber !== undefined) updateData.locoNumber = input.clientPayload.locoNumber;
      }

      const [updated] = await db
        .update(workRecords)
        .set(updateData)
        .where(eq(workRecords.id, input.id))
        .returning();

      await createAuditEntry(db, {
        userId,
        userName,
        action: "work_record.resolve_conflict",
        resourceType: "work_record",
        resourceId: input.id,
        resourceTitle: updated.title,
        details: `Resolution: ${input.resolution}`,
        workspaceId,
      });

      return updated;
    }),

  listConflicts: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);

    const records = await db
      .select()
      .from(workRecords)
      .where(
        and(
          eq(workRecords.workspaceId, workspaceId),
          eq(workRecords.syncStatus, "conflict"),
        ),
      )
      .orderBy(desc(workRecords.updatedAt));

    return records;
  }),
});
