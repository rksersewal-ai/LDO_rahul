import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getCached } from "@/lib/cache/query-cache";
import { db } from "@/lib/db";
import {
  approvals,
  auditLog,
  cases,
  documents,
  duplicateDetections,
  ocrJobs,
  plNumbers,
  rollingStockUnits,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "@/server/trpc";

/** Escape LIKE/ILIKE wildcard characters in user-supplied input */
function escapeLike(str: string): string {
  return str.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function requireWorkspaceId(ctx: { session: { user?: { workspaceId?: string | null } } }): string {
  const wsId = ctx.session?.user?.workspaceId;
  if (!wsId) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No workspace assigned" });
  }
  return wsId;
}

export const dashboardRouter = router({
  /** KPI metrics for dashboard cards */
  getMetrics: protectedProcedure
    .input(z.object({ compareRange: z.enum(["week", "month"]).optional() }).optional())
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const compareRange = input?.compareRange ?? "week";

      return getCached(`dashboard_metrics_${workspaceId}_${compareRange}`, 15_000, async () => {
        const now = new Date();
        const deltaMs =
          compareRange === "month" ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const periodStart = new Date(now.getTime() - deltaMs);
        const periodLabel = compareRange === "month" ? "this month" : "this week";

        const [
          totalDocsResult,
          docsThisWeekResult,
          pendingApprovalsResult,
          ocrQueueResult,
          openCasesResult,
          pendingDuplicatesResult,
        ] = await Promise.all([
          // Total non-deleted documents in workspace
          // Index: documents(workspace_id, is_deleted)
          db
            .select({ total: sql<number>`COALESCE(${count()}, 0)` })
            .from(documents)
            .where(and(eq(documents.workspaceId, workspaceId), eq(documents.isDeleted, 0))),

          // Documents added this period
          // Index: documents(workspace_id, is_deleted, created_at)
          db
            .select({ total: sql<number>`COALESCE(${count()}, 0)` })
            .from(documents)
            .where(
              and(
                eq(documents.workspaceId, workspaceId),
                eq(documents.isDeleted, 0),
                gte(documents.createdAt, periodStart),
              ),
            ),

          // Pending approvals for documents in this workspace
          // Index: approvals(status) + documents(workspace_id)
          db
            .select({ total: sql<number>`COALESCE(${count()}, 0)` })
            .from(approvals)
            .innerJoin(documents, eq(approvals.documentId, documents.id))
            .where(and(eq(documents.workspaceId, workspaceId), eq(approvals.status, "pending"))),

          // OCR queue (queued + processing)
          // Index: ocr_jobs(status) + documents(workspace_id)
          db
            .select({ total: sql<number>`COALESCE(${count()}, 0)` })
            .from(ocrJobs)
            .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
            .where(
              and(
                eq(documents.workspaceId, workspaceId),
                sql`${ocrJobs.status} IN ('queued', 'processing')`,
              ),
            ),

          // Open cases (open + investigating) scoped to workspace
          // Index: cases(workspace_id, status)
          db
            .select({ total: sql<number>`COALESCE(${count()}, 0)` })
            .from(cases)
            .where(
              and(
                eq(cases.workspaceId, workspaceId),
                sql`${cases.status} IN ('open', 'investigating')`,
              ),
            ),

          // Pending duplicate detections in workspace
          // Index: duplicate_detections(workspace_id, status)
          db
            .select({ total: sql<number>`COALESCE(${count()}, 0)` })
            .from(duplicateDetections)
            .where(
              and(
                eq(duplicateDetections.workspaceId, workspaceId),
                eq(duplicateDetections.status, "pending"),
              ),
            ),
        ]);

        const totalDocs = totalDocsResult[0]?.total ?? 0;
        const docsThisWeek = docsThisWeekResult[0]?.total ?? 0;
        const pendingApprovals = pendingApprovalsResult[0]?.total ?? 0;
        const ocrQueue = ocrQueueResult[0]?.total ?? 0;
        const openCases = openCasesResult[0]?.total ?? 0;
        const pendingDuplicates = pendingDuplicatesResult[0]?.total ?? 0;

        return [
          {
            id: "total_documents",
            title: "Total Documents",
            value: totalDocs,
            delta: `+${docsThisWeek}`,
            deltaDirection: docsThisWeek > 0 ? "up" : ("neutral" as const),
            context: `${docsThisWeek} added ${periodLabel}`,
          },
          {
            id: "pending_approvals",
            title: "Pending Approvals",
            value: pendingApprovals,
            delta: `${pendingApprovals}`,
            deltaDirection: pendingApprovals > 0 ? "up" : ("neutral" as const),
            context: `${pendingApprovals} awaiting review`,
          },
          {
            id: "ocr_queue",
            title: "OCR Queue",
            value: ocrQueue,
            delta: `${ocrQueue} pending`,
            deltaDirection: "neutral" as const,
            context: `${ocrQueue} items in queue`,
          },
          {
            id: "open_cases",
            title: "Open Cases",
            value: openCases,
            delta: `${openCases}`,
            deltaDirection: openCases > 0 ? "up" : ("neutral" as const),
            context: `${openCases} cases active`,
          },
          {
            id: "pending_duplicates",
            title: "Pending Duplicates",
            value: pendingDuplicates,
            delta: `${pendingDuplicates}`,
            deltaDirection: pendingDuplicates > 0 ? "up" : ("neutral" as const),
            context: `${pendingDuplicates} awaiting review`,
          },
        ] satisfies Array<{
          id: string;
          title: string;
          value: string | number;
          delta: string;
          deltaDirection: "up" | "down" | "neutral";
          context: string;
        }>;
      });
    }),

  /** Trend data for uploads/processed chart */
  getTrends: protectedProcedure
    .input(z.object({ range: z.enum(["7D", "30D", "3M", "YTD"]) }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const now = new Date();
      let startDate: Date;

      switch (input.range) {
        case "7D":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30D":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3M":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "YTD":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Count uploads per day
      // Index: documents(workspace_id, is_deleted, created_at)
      // LIMIT 365 prevents unbounded result sets for large date ranges
      const uploadsPerDay = await db
        .select({
          date: sql<string>`to_char(${documents.createdAt}::date, 'Mon DD')`,
          uploads: count(),
        })
        .from(documents)
        .where(
          and(
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, 0),
            gte(documents.createdAt, startDate),
          ),
        )
        .groupBy(sql`${documents.createdAt}::date`)
        .orderBy(sql`${documents.createdAt}::date`)
        .limit(365);

      // Count completed OCR jobs per day
      // Index: ocr_jobs(status, completed_at) + documents(workspace_id)
      // LIMIT 365 prevents unbounded result sets
      const processedPerDay = await db
        .select({
          date: sql<string>`to_char(${ocrJobs.completedAt}::date, 'Mon DD')`,
          processed: count(),
        })
        .from(ocrJobs)
        .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
        .where(
          and(
            eq(documents.workspaceId, workspaceId),
            eq(ocrJobs.status, "completed"),
            gte(ocrJobs.completedAt, startDate),
          ),
        )
        .groupBy(sql`${ocrJobs.completedAt}::date`)
        .orderBy(sql`${ocrJobs.completedAt}::date`)
        .limit(365);

      // Merge into a single array keyed by date (null-safe with COALESCE pattern)
      const processedMap = new Map<string, number>();
      for (const row of processedPerDay) {
        processedMap.set(row.date, row.processed ?? 0);
      }

      const trendData = uploadsPerDay.map((row) => ({
        date: row.date,
        uploads: row.uploads ?? 0,
        processed: processedMap.get(row.date) ?? 0,
      }));

      return trendData;
    }),

  /** Recent activity from audit log */
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Recent audit log entries for the workspace
    // Index: audit_log(workspace_id, created_at DESC)
    // LIMIT 20 bounds the result set for performance
    const entries = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        userName: auditLog.userName,
        details: auditLog.details,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(eq(auditLog.workspaceId, workspaceId))
      .orderBy(desc(auditLog.createdAt))
      .limit(20);

    // Map action strings to the ActivityItem action types
    const actionTypeMap: Record<
      string,
      "upload" | "approve" | "verify" | "reject" | "comment" | "assign"
    > = {
      "document.upload": "upload",
      "document.create": "upload",
      "approval.approve": "approve",
      "approval.reject": "reject",
      "ocr.verify": "verify",
      "ocr.accept_candidate": "verify",
      "case.assign": "assign",
      "document.comment": "comment",
    };

    const entityTypeMap: Record<string, "document" | "case" | "work_record"> = {
      document: "document",
      case: "case",
      work_record: "work_record",
      ocr_pl_candidate: "document",
      approval: "document",
    };

    return entries.map((entry) => ({
      id: entry.id,
      action: actionTypeMap[entry.action] ?? "upload",
      description: entry.details ?? `${entry.action} on ${entry.entityType}`,
      user: entry.userName ?? "Unknown",
      timestamp: entry.createdAt.toISOString(),
      entityId: entry.entityId,
      entityType: entityTypeMap[entry.entityType] ?? "document",
    })) satisfies Array<{
      id: string;
      action: "upload" | "approve" | "verify" | "reject" | "comment" | "assign";
      description: string;
      user: string;
      timestamp: string;
      entityId: string;
      entityType: "document" | "case" | "work_record";
    }>;
  }),

  /** Recent documents for the workspace */
  getRecentDocuments: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    // Recent documents for the workspace, newest first
    // Index: documents(workspace_id, is_deleted, created_at DESC)
    // LIMIT 10 keeps the response payload small and prevents unbounded scans
    const docs = await db
      .select({
        id: documents.id,
        documentNumber: documents.documentNumber,
        title: documents.title,
        category: documents.category,
        status: documents.status,
        ocrStatus: documents.ocrStatus,
        createdAt: documents.createdAt,
        ownerName: users.name,
      })
      .from(documents)
      .leftJoin(users, eq(documents.createdBy, users.id))
      .where(and(eq(documents.workspaceId, workspaceId), eq(documents.isDeleted, 0)))
      .orderBy(desc(documents.createdAt))
      .limit(10);

    // Map document status to the StatusType expected by the UI
    const statusMap: Record<string, string> = {
      draft: "pending",
      pending_review: "pending",
      under_review: "in_process",
      approved: "done",
      rejected: "failed",
      superseded: "done",
      archived: "done",
    };

    // Map ocr status to the RecentDocument ocrStatus format
    const ocrStatusMap: Record<
      string,
      "completed" | "processing" | "queued" | "failed" | "not_required"
    > = {
      not_required: "not_required",
      queued: "queued",
      processing: "processing",
      completed: "completed",
      failed: "failed",
    };

    return docs.map((doc) => ({
      id: doc.id,
      documentNumber: doc.documentNumber,
      title: doc.title,
      category: doc.category,
      status: statusMap[doc.status] ?? "pending",
      owner: doc.ownerName ?? "Unknown",
      date: doc.createdAt.toISOString().split("T")[0],
      ocrStatus: ocrStatusMap[doc.ocrStatus] ?? "not_required",
    })) satisfies Array<{
      id: string;
      documentNumber: string;
      title: string;
      category: string;
      status: string;
      owner: string;
      date: string;
      ocrStatus: "completed" | "processing" | "queued" | "failed" | "not_required";
    }>;
  }),

  /** PL Breakdown: total PLs, VD/NVD counts, by-category, safety-critical count */
  getPlBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const cacheKey = `pl_breakdown_${workspaceId}`;

    return getCached(cacheKey, 30_000, async () => {
      const [totalResult, vdResult, nvdResult, catResults, safetyResult] = await Promise.all([
        // Total PLs in workspace
        db
          .select({ total: sql<number>`COALESCE(${count()}, 0)` })
          .from(plNumbers)
          .where(eq(plNumbers.workspaceId, workspaceId)),

        // VD count
        db
          .select({ total: sql<number>`COALESCE(${count()}, 0)` })
          .from(plNumbers)
          .where(and(eq(plNumbers.workspaceId, workspaceId), eq(plNumbers.itemType, "VD"))),

        // NVD count
        db
          .select({ total: sql<number>`COALESCE(${count()}, 0)` })
          .from(plNumbers)
          .where(and(eq(plNumbers.workspaceId, workspaceId), eq(plNumbers.itemType, "NVD"))),

        // By category breakdown
        db
          .select({
            category: plNumbers.category,
            total: sql<number>`COALESCE(${count()}, 0)`,
          })
          .from(plNumbers)
          .where(eq(plNumbers.workspaceId, workspaceId))
          .groupBy(plNumbers.category),

        // Safety-critical count
        db
          .select({ total: sql<number>`COALESCE(${count()}, 0)` })
          .from(plNumbers)
          .where(and(eq(plNumbers.workspaceId, workspaceId), eq(plNumbers.safetyCritical, true))),
      ]);

      const byCategory: Record<string, number> = {};
      for (const row of catResults) {
        byCategory[row.category] = row.total;
      }

      return {
        total: totalResult[0]?.total ?? 0,
        vdCount: vdResult[0]?.total ?? 0,
        nvdCount: nvdResult[0]?.total ?? 0,
        byCategory: {
          "CAT-A": byCategory["CAT-A"] ?? 0,
          "CAT-B": byCategory["CAT-B"] ?? 0,
          "CAT-C": byCategory["CAT-C"] ?? 0,
          "CAT-D": byCategory["CAT-D"] ?? 0,
        },
        safetyCriticalCount: safetyResult[0]?.total ?? 0,
      };
    });
  }),

  /** Drill-down data for KPI metric cards - returns paginated rows */
  getDrillDownData: protectedProcedure
    .input(
      z.object({
        metricId: z.string(),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const { metricId, limit, offset, search } = input;

      switch (metricId) {
        case "total_documents": {
          const searchFilter = search
            ? or(
                ilike(documents.documentNumber, `%${escapeLike(search)}%`),
                ilike(documents.title, `%${escapeLike(search)}%`),
              )
            : undefined;

          const baseWhere = and(
            eq(documents.workspaceId, workspaceId),
            eq(documents.isDeleted, 0),
            searchFilter,
          );

          const [rows, totalResult] = await Promise.all([
            db
              .select({
                id: documents.id,
                documentNumber: documents.documentNumber,
                title: documents.title,
                category: documents.category,
                status: documents.status,
                createdAt: documents.createdAt,
              })
              .from(documents)
              .where(baseWhere)
              .orderBy(desc(documents.createdAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ total: sql<number>`COALESCE(${count()}, 0)` })
              .from(documents)
              .where(baseWhere),
          ]);

          return {
            items: rows.map((r) => ({
              id: r.id,
              documentNumber: r.documentNumber,
              title: r.title,
              category: r.category,
              status: r.status,
              createdAt: r.createdAt.toISOString(),
            })),
            total: totalResult[0]?.total ?? 0,
          };
        }

        case "pending_approvals": {
          const searchFilter = search
            ? or(
                ilike(documents.documentNumber, `%${escapeLike(search)}%`),
                ilike(documents.title, `%${escapeLike(search)}%`),
              )
            : undefined;

          const baseWhere = and(
            eq(documents.workspaceId, workspaceId),
            eq(approvals.status, "pending"),
            searchFilter,
          );

          const [rows, totalResult] = await Promise.all([
            db
              .select({
                id: approvals.id,
                documentNumber: documents.documentNumber,
                title: documents.title,
                requestedBy: approvals.requestedBy,
                level: approvals.level,
                createdAt: approvals.createdAt,
              })
              .from(approvals)
              .innerJoin(documents, eq(approvals.documentId, documents.id))
              .where(baseWhere)
              .orderBy(desc(approvals.createdAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ total: sql<number>`COALESCE(${count()}, 0)` })
              .from(approvals)
              .innerJoin(documents, eq(approvals.documentId, documents.id))
              .where(baseWhere),
          ]);

          return {
            items: rows.map((r) => ({
              id: r.id,
              documentNumber: r.documentNumber,
              title: r.title,
              requestedBy: r.requestedBy,
              level: r.level,
              createdAt: r.createdAt.toISOString(),
            })),
            total: totalResult[0]?.total ?? 0,
          };
        }

        case "ocr_queue": {
          const searchFilter = search
            ? ilike(documents.documentNumber, `%${escapeLike(search)}%`)
            : undefined;

          const baseWhere = and(
            eq(documents.workspaceId, workspaceId),
            sql`${ocrJobs.status} IN ('queued', 'processing')`,
            searchFilter,
          );

          const [rows, totalResult] = await Promise.all([
            db
              .select({
                id: ocrJobs.id,
                documentNumber: documents.documentNumber,
                status: ocrJobs.status,
                engine: ocrJobs.engine,
                createdAt: ocrJobs.createdAt,
              })
              .from(ocrJobs)
              .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
              .where(baseWhere)
              .orderBy(desc(ocrJobs.createdAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ total: sql<number>`COALESCE(${count()}, 0)` })
              .from(ocrJobs)
              .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
              .where(baseWhere),
          ]);

          return {
            items: rows.map((r) => ({
              id: r.id,
              documentNumber: r.documentNumber,
              status: r.status,
              engine: r.engine ?? "tesseract",
              createdAt: r.createdAt.toISOString(),
            })),
            total: totalResult[0]?.total ?? 0,
          };
        }

        case "open_cases": {
          const searchFilter = search
            ? or(
                ilike(cases.caseNumber, `%${escapeLike(search)}%`),
                ilike(cases.title, `%${escapeLike(search)}%`),
              )
            : undefined;

          const baseWhere = and(
            eq(cases.workspaceId, workspaceId),
            sql`${cases.status} IN ('open', 'investigating')`,
            searchFilter,
          );

          const [rows, totalResult] = await Promise.all([
            db
              .select({
                id: cases.id,
                caseNumber: cases.caseNumber,
                title: cases.title,
                priority: cases.priority,
                status: cases.status,
                createdAt: cases.createdAt,
              })
              .from(cases)
              .where(baseWhere)
              .orderBy(desc(cases.createdAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ total: sql<number>`COALESCE(${count()}, 0)` })
              .from(cases)
              .where(baseWhere),
          ]);

          return {
            items: rows.map((r) => ({
              id: r.id,
              caseNumber: r.caseNumber,
              title: r.title,
              priority: r.priority,
              status: r.status,
              createdAt: r.createdAt.toISOString(),
            })),
            total: totalResult[0]?.total ?? 0,
          };
        }

        case "pending_duplicates": {
          const searchFilter = search
            ? ilike(documents.documentNumber, `%${escapeLike(search)}%`)
            : undefined;

          const baseWhere = and(
            eq(duplicateDetections.workspaceId, workspaceId),
            eq(duplicateDetections.status, "pending"),
            searchFilter,
          );

          const [rows, totalResult] = await Promise.all([
            db
              .select({
                id: duplicateDetections.id,
                documentNumber: documents.documentNumber,
                score: duplicateDetections.score,
                detectedAt: duplicateDetections.detectedAt,
              })
              .from(duplicateDetections)
              .innerJoin(documents, eq(duplicateDetections.documentAId, documents.id))
              .where(baseWhere)
              .orderBy(desc(duplicateDetections.detectedAt))
              .limit(limit)
              .offset(offset),
            db
              .select({ total: sql<number>`COALESCE(${count()}, 0)` })
              .from(duplicateDetections)
              .innerJoin(documents, eq(duplicateDetections.documentAId, documents.id))
              .where(baseWhere),
          ]);

          return {
            items: rows.map((r) => ({
              id: r.id,
              documentNumber: r.documentNumber,
              matchScore: Math.round((r.score ?? 0) * 100),
              detectedAt: r.detectedAt.toISOString(),
            })),
            total: totalResult[0]?.total ?? 0,
          };
        }

        default:
          return { items: [], total: 0 };
      }
    }),

  /** Pending approvals summary (top 5) for dashboard widget */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const rows = await db
      .select({
        id: approvals.id,
        documentNumber: documents.documentNumber,
        title: documents.title,
        requestedBy: approvals.requestedBy,
        level: approvals.level,
        createdAt: approvals.createdAt,
      })
      .from(approvals)
      .innerJoin(documents, eq(approvals.documentId, documents.id))
      .where(and(eq(documents.workspaceId, workspaceId), eq(approvals.status, "pending")))
      .orderBy(desc(approvals.createdAt))
      .limit(5);

    return rows.map((r) => ({
      id: r.id,
      documentNumber: r.documentNumber,
      title: r.title,
      requestedBy: r.requestedBy,
      level: r.level,
      createdAt: r.createdAt.toISOString(),
      daysPending: Math.floor((Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }),

  /** Rolling Stock Summary: total units, by-status, by-product-type */
  getRollingStockSummary: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const cacheKey = `rolling_stock_summary_${workspaceId}`;

    return getCached(cacheKey, 30_000, async () => {
      const [totalResult, statusResults, productTypeResults] = await Promise.all([
        // Total rolling stock units in workspace
        db
          .select({ total: sql<number>`COALESCE(${count()}, 0)` })
          .from(rollingStockUnits)
          .where(eq(rollingStockUnits.workspaceId, workspaceId)),

        // By status breakdown
        db
          .select({
            status: rollingStockUnits.status,
            total: sql<number>`COALESCE(${count()}, 0)`,
          })
          .from(rollingStockUnits)
          .where(eq(rollingStockUnits.workspaceId, workspaceId))
          .groupBy(rollingStockUnits.status),

        // By product type (via bom_products join)
        db
          .select({
            // product_type is a Postgres enum (bom_product_type); cast to text
            // before COALESCE so the 'unclassified' fallback literal isn't coerced
            // into the enum (which errors: invalid input value for enum).
            productType: sql<string>`COALESCE(bp."product_type"::text, 'unclassified')`,
            total: sql<number>`COALESCE(${count()}, 0)`,
          })
          .from(rollingStockUnits)
          .leftJoin(sql`"bom_products" AS bp`, sql`bp."id" = ${rollingStockUnits.productId}`)
          .where(eq(rollingStockUnits.workspaceId, workspaceId))
          .groupBy(sql`bp."product_type"`),
      ]);

      const byStatus: Record<string, number> = {};
      for (const row of statusResults) {
        byStatus[row.status] = row.total;
      }

      const byProductType: Record<string, number> = {};
      for (const row of productTypeResults) {
        byProductType[row.productType] = row.total;
      }

      return {
        total: totalResult[0]?.total ?? 0,
        byStatus: {
          active: byStatus.active ?? 0,
          under_overhaul: byStatus.under_overhaul ?? 0,
          condemned: byStatus.condemned ?? 0,
          transferred: byStatus.transferred ?? 0,
          awaiting_commissioning: byStatus.awaiting_commissioning ?? 0,
        },
        byProductType,
      };
    });
  }),
});
