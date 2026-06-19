import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { sanitizeUserInput } from "@/lib/security/sanitize";
import { escapeLikePattern } from "@/lib/utils/escape-like";
import {
  assignCaseSchema,
  caseListSchema,
  closeCaseSchema,
  createCaseSchema,
  updateCaseSchema,
} from "@/lib/validators/cases";
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

/** Map frontend status values (UPPER_CASE) to DB enum values (lowercase) */
function mapStatusToDb(
  status: string,
): "open" | "investigating" | "resolved" | "closed" | "escalated" {
  const statusMap: Record<string, "open" | "investigating" | "resolved" | "closed" | "escalated"> =
    {
      OPEN: "open",
      IN_PROGRESS: "investigating",
      RESOLVED: "resolved",
      CLOSED: "closed",
      ESCALATED: "escalated",
    };
  return statusMap[status] ?? "open";
}

/** Map DB status values back to frontend status values */
function mapStatusFromDb(status: string): string {
  const statusMap: Record<string, string> = {
    open: "OPEN",
    investigating: "IN_PROGRESS",
    resolved: "RESOLVED",
    closed: "CLOSED",
    escalated: "ESCALATED",
  };
  return statusMap[status] ?? "OPEN";
}

/** Map frontend severity to DB priority */
function mapSeverityToDbPriority(severity: string): "low" | "medium" | "high" | "critical" {
  const severityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  };
  return severityMap[severity] ?? "medium";
}

/** Map DB row to the frontend-expected shape */
function mapCaseToFrontend(row: typeof cases.$inferSelect) {
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    title: row.title,
    description: row.description ?? "",
    type: row.type ?? "failure_investigation",
    status: mapStatusFromDb(row.status),
    severity: (row.severity ?? row.priority ?? "MEDIUM").toUpperCase(),
    assigneeId: row.assignedTo ?? null,
    assigneeName: row.assigneeName ?? null,
    reporterId: row.reporterId ?? row.createdBy ?? null,
    reporterName: row.reporterName ?? null,
    plNumber: row.relatedPlId ?? null,
    vendorName: row.vendorName ?? null,
    tenderNumber: row.tenderNumber ?? null,
    linkedDocumentIds: (() => {
      if (!row.linkedDocumentIds) return [];
      try {
        return JSON.parse(row.linkedDocumentIds);
      } catch {
        return [];
      }
    })(),
    resolution: row.resolution ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

export const casesRouter = router({
  list: protectedProcedure.input(caseListSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);

    const conditions = [eq(cases.workspaceId, workspaceId)];

    if (input.status) {
      const dbStatus = mapStatusToDb(input.status);
      conditions.push(eq(cases.status, dbStatus));
    }

    if (input.severity) {
      conditions.push(eq(cases.severity, input.severity));
    }

    if (input.type) {
      conditions.push(eq(cases.type, input.type));
    }

    if (input.assigneeId) {
      conditions.push(eq(cases.assignedTo, input.assigneeId));
    }

    if (input.search) {
      const escaped = escapeLikePattern(input.search);
      conditions.push(
        or(
          ilike(cases.title, `%${escaped}%`),
          ilike(cases.caseNumber, `%${escaped}%`),
          ilike(cases.description, `%${escaped}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    // Sort column mapping
    const sortColumnMap: Record<string, typeof cases.createdAt> = {
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt as never,
      severity: cases.severity as never,
      caseNumber: cases.caseNumber as never,
    };

    const sortCol = sortColumnMap[input.sortBy] ?? cases.createdAt;
    const orderFn = input.sortOrder === "asc" ? asc : desc;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(cases)
        .where(whereClause)
        .orderBy(orderFn(sortCol))
        .limit(input.limit)
        .offset(input.offset),
      db.select({ total: count() }).from(cases).where(whereClause),
    ]);

    const items = data.map(mapCaseToFrontend);

    return { items, total: totalResult[0]?.total ?? 0 };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);

    const [row] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)));

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
    }

    return mapCaseToFrontend(row);
  }),

  create: engineerProcedure.input(createCaseSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    const id = randomUUID();
    const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}-${id.slice(0, 4).toUpperCase()}`;

    const [created] = await db
      .insert(cases)
      .values({
        id,
        workspaceId,
        caseNumber,
        title: sanitizeUserInput(input.title),
        description: sanitizeUserInput(input.description),
        status: "open",
        priority: mapSeverityToDbPriority(input.severity),
        type: input.type,
        severity: input.severity,
        assignedTo: input.assigneeId,
        assigneeName: null,
        reporterId: userId,
        reporterName: userName,
        vendorName: input.vendorName || null,
        tenderNumber: input.tenderNumber || null,
        relatedPlId: input.plNumber || null,
        linkedDocumentIds: "[]",
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "case.created",
      resourceType: "case",
      resourceId: id,
      resourceTitle: input.title,
      details: `Created case ${caseNumber}: ${input.title}`,
      workspaceId,
    });

    return mapCaseToFrontend(created);
  }),

  update: engineerProcedure.input(updateCaseSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Verify case exists in workspace
    const [existing] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
    }

    const updateValues: Record<string, unknown> = { updatedBy: userId, updatedAt: new Date() };

    if (input.title !== undefined) updateValues.title = sanitizeUserInput(input.title);
    if (input.description !== undefined)
      updateValues.description = sanitizeUserInput(input.description);
    if (input.type !== undefined) updateValues.type = input.type;
    if (input.severity !== undefined) {
      updateValues.severity = input.severity;
      updateValues.priority = mapSeverityToDbPriority(input.severity);
    }
    if (input.status !== undefined) {
      updateValues.status = mapStatusToDb(input.status);
      if (input.status === "RESOLVED") {
        updateValues.resolvedAt = new Date();
      }
      if (input.status === "CLOSED") {
        updateValues.closedAt = new Date();
      }
    }
    if (input.plNumber !== undefined) updateValues.relatedPlId = input.plNumber || null;
    if (input.vendorName !== undefined) updateValues.vendorName = input.vendorName || null;
    if (input.tenderNumber !== undefined) updateValues.tenderNumber = input.tenderNumber || null;
    if (input.assigneeId !== undefined) updateValues.assignedTo = input.assigneeId;
    if (input.resolution !== undefined) updateValues.resolution = input.resolution;

    const [updated] = await db
      .update(cases)
      .set(updateValues)
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "case.updated",
      resourceType: "case",
      resourceId: input.id,
      resourceTitle: updated.title,
      details: `Updated case ${updated.caseNumber}`,
      oldValue: JSON.stringify({ status: existing.status, priority: existing.priority }),
      newValue: JSON.stringify(updateValues),
      workspaceId,
    });

    return mapCaseToFrontend(updated);
  }),

  assign: engineerProcedure.input(assignCaseSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Verify case exists in workspace
    const [existing] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
    }

    const [updated] = await db
      .update(cases)
      .set({
        assignedTo: input.assigneeId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "case.assigned",
      resourceType: "case",
      resourceId: input.id,
      resourceTitle: updated.title,
      details: `Assigned case ${updated.caseNumber} to ${input.assigneeId}`,
      oldValue: existing.assignedTo ?? undefined,
      newValue: input.assigneeId,
      workspaceId,
    });

    return mapCaseToFrontend(updated);
  }),

  close: engineerProcedure.input(closeCaseSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx as never);
    const userId = ctx.session.user?.id ?? "unknown";
    const userName = ctx.session.user?.name ?? "Unknown User";

    // Verify case exists in workspace
    const [existing] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
    }

    const [updated] = await db
      .update(cases)
      .set({
        status: "closed",
        resolution: input.resolution,
        closedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, input.id), eq(cases.workspaceId, workspaceId)))
      .returning();

    await createAuditEntry(db, {
      userId,
      userName,
      action: "case.closed",
      resourceType: "case",
      resourceId: input.id,
      resourceTitle: updated.title,
      details: `Closed case ${updated.caseNumber} with resolution`,
      oldValue: existing.status,
      newValue: "closed",
      workspaceId,
    });

    return mapCaseToFrontend(updated);
  }),
});
