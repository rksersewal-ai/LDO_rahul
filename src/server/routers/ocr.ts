import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import {
  documentPlLinks,
  documents,
  notifications,
  ocrJobs,
  ocrPlCandidates,
  plNumbers,
  users,
} from "@/lib/db/schema";
import { addOcrJob } from "@/workers/ocr-queue";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user?: { workspaceId?: string | null } } }): string {
  const wsId = ctx.session?.user?.workspaceId;
  if (!wsId) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No workspace assigned" });
  }
  return wsId;
}

export const ocrRouter = router({
  /** List OCR jobs with optional status filter, paginated */
  getQueue: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const conditions = [eq(documents.workspaceId, workspaceId)];
      if (input?.status) {
        conditions.push(eq(ocrJobs.status, input.status as typeof ocrJobs.status.enumValues[number]));
      }

      const [jobs, totalResult] = await Promise.all([
        db
          .select({
            id: ocrJobs.id,
            documentId: ocrJobs.documentId,
            workspaceId: ocrJobs.workspaceId,
            status: ocrJobs.status,
            engine: ocrJobs.engine,
            language: ocrJobs.language,
            confidence: ocrJobs.confidence,
            pageCount: ocrJobs.pageCount,
            processedPages: ocrJobs.processedPages,
            extractedText: ocrJobs.extractedText,
            errorMessage: ocrJobs.errorMessage,
            retryCount: ocrJobs.retryCount,
            startedAt: ocrJobs.startedAt,
            completedAt: ocrJobs.completedAt,
            createdAt: ocrJobs.createdAt,
            updatedAt: ocrJobs.updatedAt,
            documentNumber: documents.documentNumber,
            documentTitle: documents.title,
          })
          .from(ocrJobs)
          .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
          .where(and(...conditions))
          .orderBy(desc(ocrJobs.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(ocrJobs)
          .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
          .where(and(...conditions)),
      ]);

      return { data: jobs, total: totalResult[0]?.total ?? 0 };
    }),

  /** Get a single OCR job by ID */
  getJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [job] = await db
        .select()
        .from(ocrJobs)
        .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
        .where(and(eq(ocrJobs.id, input.jobId), eq(documents.workspaceId, workspaceId)))
        .limit(1);

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "OCR job not found" });
      }

      return job.ocr_jobs;
    }),

  /** Get latest OCR job for a specific document */
  getByDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [job] = await db
        .select()
        .from(ocrJobs)
        .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
        .where(and(eq(ocrJobs.documentId, input.documentId), eq(documents.workspaceId, workspaceId)))
        .orderBy(desc(ocrJobs.createdAt))
        .limit(1);

      return job?.ocr_jobs ?? null;
    }),

  /** Get OCR PL candidates for a document */
  getCandidates: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const candidates = await db
        .select()
        .from(ocrPlCandidates)
        .where(
          and(
            eq(ocrPlCandidates.documentId, input.documentId),
            eq(ocrPlCandidates.workspaceId, workspaceId),
          ),
        );

      return candidates;
    }),

  /** Accept an OCR PL candidate - link to PL or mark unresolved */
  acceptCandidate: engineerProcedure
    .input(z.object({ candidateId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Lookup candidate
      const [candidate] = await db
        .select()
        .from(ocrPlCandidates)
        .where(
          and(
            eq(ocrPlCandidates.id, input.candidateId),
            eq(ocrPlCandidates.workspaceId, workspaceId),
          ),
        )
        .limit(1);

      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      }

      // Lookup PL number in same workspace
      const [pl] = await db
        .select()
        .from(plNumbers)
        .where(
          and(
            eq(plNumbers.plNumber, candidate.plNumber),
            eq(plNumbers.workspaceId, workspaceId),
          ),
        )
        .limit(1);

      const now = new Date();

      if (pl) {
        // PL found - create link and accept candidate
        await db.insert(documentPlLinks).values({
          id: nanoid(),
          documentId: candidate.documentId,
          plNumberId: pl.id,
          linkType: "ocr_accepted",
          confidence: candidate.confidence,
          linkedBy: userId,
          linkedAt: now,
        });

        await db
          .update(ocrPlCandidates)
          .set({
            status: "accepted",
            acceptedBy: userId,
            acceptedAt: now,
          })
          .where(eq(ocrPlCandidates.id, input.candidateId));
      } else {
        // PL not found - mark unresolved and notify admins
        await db
          .update(ocrPlCandidates)
          .set({ status: "unresolved" })
          .where(eq(ocrPlCandidates.id, input.candidateId));

        // Find workspace admins and send notifications
        const admins = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.workspaceId, workspaceId), eq(users.role, "admin")));

        if (admins.length > 0) {
          const notificationsData = admins.map((admin) => ({
            id: nanoid(),
            userId: admin.id,
            type: "system" as const,
            title: "Unresolved PL Candidate",
            message: `OCR detected PL number ${candidate.plNumber} but it does not exist in the system.`,
            entityType: "ocr_pl_candidate",
            entityId: input.candidateId,
            workspaceId,
          }));

          await db.insert(notifications).values(notificationsData);
        }
      }

      // Create audit log
      await createAuditEntry(db, {
        userId,
        userName,
        action: "ocr.accept_candidate",
        resourceType: "ocr_pl_candidate",
        resourceId: input.candidateId,
        workspaceId,
      });

      // Return updated candidate
      const [updated] = await db
        .select()
        .from(ocrPlCandidates)
        .where(eq(ocrPlCandidates.id, input.candidateId))
        .limit(1);

      return updated;
    }),

  /** Reject an OCR PL candidate */
  rejectCandidate: engineerProcedure
    .input(z.object({ candidateId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Lookup candidate
      const [candidate] = await db
        .select()
        .from(ocrPlCandidates)
        .where(
          and(
            eq(ocrPlCandidates.id, input.candidateId),
            eq(ocrPlCandidates.workspaceId, workspaceId),
          ),
        )
        .limit(1);

      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      }

      // Update status to rejected
      await db
        .update(ocrPlCandidates)
        .set({
          status: "rejected",
          rejectedBy: userId,
          rejectedReason: input.reason ?? null,
        })
        .where(eq(ocrPlCandidates.id, input.candidateId));

      // Create audit log
      await createAuditEntry(db, {
        userId,
        userName,
        action: "ocr.reject_candidate",
        resourceType: "ocr_pl_candidate",
        resourceId: input.candidateId,
        workspaceId,
      });

      // Return updated candidate
      const [updated] = await db
        .select()
        .from(ocrPlCandidates)
        .where(eq(ocrPlCandidates.id, input.candidateId))
        .limit(1);

      return updated;
    }),

  /** Retrigger OCR processing for a document */
  retrigger: engineerProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const userId = ctx.session.user.id;
      const userName = ctx.session.user.name ?? "Unknown";

      // Verify document exists and belongs to workspace
      const [doc] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, input.documentId), eq(documents.workspaceId, workspaceId)))
        .limit(1);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Create new OCR job record
      const jobId = nanoid();
      const now = new Date();
      await db.insert(ocrJobs).values({
        id: jobId,
        documentId: input.documentId,
        workspaceId,
        status: "queued",
        createdAt: now,
        updatedAt: now,
      });

      // Update document OCR status
      await db
        .update(documents)
        .set({ ocrStatus: "queued" })
        .where(eq(documents.id, input.documentId));

      // Enqueue the OCR job
      await addOcrJob({
        jobId,
        documentId: input.documentId,
        versionId: "",
        filePath: doc.filePath ?? "",
        mimeType: doc.mimeType ?? "application/pdf",
      });

      // Create audit log
      await createAuditEntry(db, {
        userId,
        userName,
        action: "ocr.retrigger",
        resourceType: "document",
        resourceId: input.documentId,
        workspaceId,
      });

      // Return the new job
      const [newJob] = await db
        .select()
        .from(ocrJobs)
        .where(eq(ocrJobs.id, jobId))
        .limit(1);

      return newJob;
    }),

  /** Get latest OCR job status for a document */
  getJobStatus: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);

      const [job] = await db
        .select({
          status: ocrJobs.status,
          confidence: ocrJobs.confidence,
          pageCount: ocrJobs.pageCount,
          errorMessage: ocrJobs.errorMessage,
        })
        .from(ocrJobs)
        .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
        .where(and(eq(ocrJobs.documentId, input.documentId), eq(documents.workspaceId, workspaceId)))
        .orderBy(desc(ocrJobs.createdAt))
        .limit(1);

      return job ?? null;
    }),

  /** Get OCR queue statistics for the workspace */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);

    const statusCounts = await db
      .select({
        status: ocrJobs.status,
        count: count(),
      })
      .from(ocrJobs)
      .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
      .where(eq(documents.workspaceId, workspaceId))
      .groupBy(ocrJobs.status);

    const [avgResult] = await db
      .select({
        avgConfidence: sql<number>`coalesce(avg(${ocrJobs.confidence}), 0)`,
      })
      .from(ocrJobs)
      .innerJoin(documents, eq(ocrJobs.documentId, documents.id))
      .where(and(eq(documents.workspaceId, workspaceId), eq(ocrJobs.status, "completed")));

    const stats: Record<string, number> = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    let totalJobs = 0;
    for (const row of statusCounts) {
      stats[row.status] = row.count;
      totalJobs += row.count;
    }

    return {
      totalJobs,
      queued: stats.queued,
      processing: stats.processing,
      completed: stats.completed,
      failed: stats.failed,
      cancelled: stats.cancelled,
      avgConfidence: avgResult?.avgConfidence ?? 0,
    };
  }),
});
