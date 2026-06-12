import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  approvalChainTemplates,
  approvals,
  approvalSteps,
  documents,
} from "@/lib/db/schema";
import { createAndPushNotification } from "@/lib/notifications/push-notification";
import type { UserRole } from "@/lib/types/auth";
import { adminProcedure, protectedProcedure, router } from "@/server/trpc";

interface TemplateStep {
  order: number;
  roleRequired: string;
  daysToEscalate: number;
}

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

export const approvalsRouter = router({
  /**
   * Submit an entity for multi-step approval.
   */
  submitForApproval: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["document", "bom", "governance"]),
        entityId: z.string(),
        chainTemplateId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = requireWorkspaceId(ctx as { session: { user: { workspaceId: string | null } } });

      // Find the chain template
      let templateId = input.chainTemplateId;
      let templateRow;

      if (templateId) {
        [templateRow] = await db
          .select()
          .from(approvalChainTemplates)
          .where(eq(approvalChainTemplates.id, templateId))
          .limit(1);
      } else {
        // Find default template for this entity type and workspace
        [templateRow] = await db
          .select()
          .from(approvalChainTemplates)
          .where(
            and(
              eq(approvalChainTemplates.workspaceId, workspaceId),
              eq(approvalChainTemplates.entityType, input.entityType),
              eq(approvalChainTemplates.isDefault, true),
            ),
          )
          .limit(1);
      }

      if (!templateRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No approval chain template found. Create a template first.",
        });
      }

      templateId = templateRow.id;

      // Parse template steps
      const steps: TemplateStep[] = JSON.parse(templateRow.steps);
      if (!steps.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approval chain template has no steps defined.",
        });
      }

      // Sort steps by order
      steps.sort((a, b) => a.order - b.order);

      const requestId = randomUUID();
      const now = new Date();

      // Create the approval request
      await db.insert(approvals).values({
        id: requestId,
        documentId: input.entityType === "document" ? input.entityId : input.entityId,
        requestedBy: userId,
        assignedTo: userId, // Initial submitter; will be updated as steps progress
        status: "pending",
        level: steps[0].roleRequired,
        chainTemplateId: templateId,
        currentStep: 1,
        totalSteps: steps.length,
        workspaceId,
        entityType: input.entityType,
        entityId: input.entityId,
        createdAt: now,
        updatedAt: now,
      });

      // Create all approval steps
      for (const step of steps) {
        const stepId = randomUUID();
        const dueAt = step.daysToEscalate
          ? new Date(now.getTime() + step.daysToEscalate * 24 * 60 * 60 * 1000)
          : null;

        await db.insert(approvalSteps).values({
          id: stepId,
          requestId,
          stepOrder: step.order,
          assignedTo: null,
          roleRequired: step.roleRequired,
          status: "pending",
          dueAt,
        });
      }

      // If entity is a document, update its status to pending_review
      if (input.entityType === "document") {
        await db
          .update(documents)
          .set({ status: "pending_review", updatedAt: now, updatedBy: userId })
          .where(eq(documents.id, input.entityId));
      }

      await createAuditEntry(db, {
        userId,
        userName,
        action: "APPROVAL_SUBMITTED",
        resourceType: input.entityType,
        resourceId: input.entityId,
        resourceTitle: `Approval request for ${input.entityType}`,
        details: `Created approval chain with ${steps.length} steps using template "${templateRow.name}"`,
        workspaceId,
      });

      // Notify the first step's assigned_to (if set) about the new approval request
      const [firstStep] = await db
        .select()
        .from(approvalSteps)
        .where(
          and(
            eq(approvalSteps.requestId, requestId),
            eq(approvalSteps.stepOrder, 1),
          ),
        )
        .limit(1);

      if (firstStep?.assignedTo) {
        await createAndPushNotification({
          userId: firstStep.assignedTo,
          type: "approval_request",
          title: "New approval request",
          body: `A new ${input.entityType} approval request requires your review.`,
          entityType: "approval",
          entityId: requestId,
          workspaceId,
          actionUrl: "/approvals",
        }).catch(() => {});
      }

      return {
        id: requestId,
        entityType: input.entityType,
        entityId: input.entityId,
        status: "pending",
        currentStep: 1,
        totalSteps: steps.length,
      };
    }),

  /**
   * Get the current active step of an approval request.
   */
  getCurrentStep: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      const [request] = await db
        .select()
        .from(approvals)
        .where(eq(approvals.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval request not found" });
      }

      if (!request.currentStep) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active step for this request" });
      }

      const [step] = await db
        .select()
        .from(approvalSteps)
        .where(
          and(
            eq(approvalSteps.requestId, input.requestId),
            eq(approvalSteps.stepOrder, request.currentStep),
          ),
        )
        .limit(1);

      if (!step) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Current step not found" });
      }

      return {
        request: {
          id: request.id,
          status: request.status,
          currentStep: request.currentStep,
          totalSteps: request.totalSteps,
          entityType: request.entityType,
          entityId: request.entityId,
        },
        step,
      };
    }),

  /**
   * Approve the current step of an approval request.
   */
  approveStep: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        comments: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as UserRole;
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      const [request] = await db
        .select()
        .from(approvals)
        .where(eq(approvals.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval request not found" });
      }

      if (request.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Approval request is not pending" });
      }

      if (!request.currentStep) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active step" });
      }

      // Get the current step
      const [currentStep] = await db
        .select()
        .from(approvalSteps)
        .where(
          and(
            eq(approvalSteps.requestId, input.requestId),
            eq(approvalSteps.stepOrder, request.currentStep),
          ),
        )
        .limit(1);

      if (!currentStep) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Current step not found" });
      }

      // Check user has the required role
      if (!isRoleAtLeast(userRole, currentStep.roleRequired as UserRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Requires role "${currentStep.roleRequired}" or higher to approve this step`,
        });
      }

      const now = new Date();

      // Update current step as approved
      await db
        .update(approvalSteps)
        .set({
          status: "approved",
          assignedTo: userId,
          decidedAt: now,
          comments: input.comments ?? null,
        })
        .where(eq(approvalSteps.id, currentStep.id));

      const isLastStep = request.currentStep >= (request.totalSteps ?? 1);

      if (isLastStep) {
        // Chain complete - mark approval as approved
        await db
          .update(approvals)
          .set({
            status: "approved",
            decidedAt: now,
            updatedAt: now,
          })
          .where(eq(approvals.id, input.requestId));

        // If entity is a document, update its status to approved
        if (request.entityType === "document" && request.entityId) {
          await db
            .update(documents)
            .set({ status: "approved", updatedAt: now, approvedBy: userId, approvedAt: now })
            .where(eq(documents.id, request.entityId));
        }
      } else {
        // Advance to next step
        await db
          .update(approvals)
          .set({
            currentStep: request.currentStep + 1,
            updatedAt: now,
          })
          .where(eq(approvals.id, input.requestId));
      }

      await createAuditEntry(db, {
        userId,
        userName,
        action: "APPROVAL_STEP_APPROVED",
        resourceType: request.entityType ?? "approval",
        resourceId: request.entityId ?? request.id,
        resourceTitle: `Step ${request.currentStep} approved`,
        details: `Approved step ${request.currentStep}/${request.totalSteps}${input.comments ? `: ${input.comments}` : ""}`,
        workspaceId,
      });

      // If chain completed, notify the original requester
      if (isLastStep && request.requestedBy) {
        await createAndPushNotification({
          userId: request.requestedBy,
          type: "approval_decision",
          title: "Approval completed",
          body: `Your ${request.entityType ?? "approval"} request has been fully approved.`,
          entityType: "approval",
          entityId: request.id,
          workspaceId,
          actionUrl: "/approvals",
        }).catch(() => {});
      }

      return {
        id: request.id,
        status: isLastStep ? "approved" : "pending",
        currentStep: isLastStep ? request.currentStep : request.currentStep + 1,
        totalSteps: request.totalSteps,
        completed: isLastStep,
      };
    }),

  /**
   * Reject an approval request, stopping the chain immediately.
   */
  rejectRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        reason: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

      const [request] = await db
        .select()
        .from(approvals)
        .where(eq(approvals.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval request not found" });
      }

      if (request.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Approval request is not pending" });
      }

      const now = new Date();

      // Update the approval request as rejected
      await db
        .update(approvals)
        .set({
          status: "rejected",
          comments: input.reason,
          decidedAt: now,
          updatedAt: now,
        })
        .where(eq(approvals.id, input.requestId));

      // Update current step as rejected
      if (request.currentStep) {
        await db
          .update(approvalSteps)
          .set({
            status: "rejected",
            comments: input.reason,
            decidedAt: now,
            assignedTo: userId,
          })
          .where(
            and(
              eq(approvalSteps.requestId, input.requestId),
              eq(approvalSteps.stepOrder, request.currentStep),
            ),
          );
      }

      // If entity is a document, update its status to rejected
      if (request.entityType === "document" && request.entityId) {
        await db
          .update(documents)
          .set({ status: "rejected", updatedAt: now, updatedBy: userId })
          .where(eq(documents.id, request.entityId));
      }

      await createAuditEntry(db, {
        userId,
        userName,
        action: "APPROVAL_REJECTED",
        resourceType: request.entityType ?? "approval",
        resourceId: request.entityId ?? request.id,
        resourceTitle: `Approval request rejected`,
        details: `Rejected at step ${request.currentStep}/${request.totalSteps}: ${input.reason}`,
        workspaceId,
      });

      // Notify the original requester about the rejection
      if (request.requestedBy) {
        await createAndPushNotification({
          userId: request.requestedBy,
          type: "approval_decision",
          title: "Request rejected",
          body: `Your ${request.entityType ?? "approval"} request was rejected: ${input.reason}`,
          entityType: "approval",
          entityId: request.id,
          workspaceId,
          actionUrl: "/approvals",
        }).catch(() => {});
      }

      return {
        id: request.id,
        status: "rejected" as const,
        reason: input.reason,
      };
    }),

  /**
   * Check for overdue approval steps and mark them as escalated.
   * Admin-only procedure.
   */
  checkEscalation: adminProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user?.id ?? "system";
    const userName = ctx.session.user?.name ?? "System";
    const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string;

    const now = new Date();

    // Find all pending steps where due_at < now and not yet escalated
    const overdueSteps = await db
      .select({ id: approvalSteps.id, requestId: approvalSteps.requestId })
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.status, "pending"),
          lt(approvalSteps.dueAt, now),
          isNull(approvalSteps.escalatedAt),
        ),
      );

    if (overdueSteps.length > 0) {
      const overdueIds = overdueSteps.map((s) => s.id);
      // Update each overdue step
      for (const step of overdueSteps) {
        await db
          .update(approvalSteps)
          .set({ escalatedAt: now })
          .where(eq(approvalSteps.id, step.id));
      }

      await createAuditEntry(db, {
        userId,
        userName,
        action: "APPROVAL_ESCALATION_CHECK",
        resourceType: "approval_step",
        resourceId: overdueIds[0],
        resourceTitle: `Escalated ${overdueSteps.length} overdue steps`,
        details: `Found and escalated ${overdueSteps.length} overdue approval steps`,
        workspaceId,
      });
    }

    return { escalatedCount: overdueSteps.length };
  }),

  /**
   * List approval requests with optional filtering.
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "returned"]).optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const conditions = input.status ? eq(approvals.status, input.status) : undefined;

      const items = await db
        .select()
        .from(approvals)
        .where(conditions)
        .orderBy(sql`${approvals.createdAt} DESC`)
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(approvals)
        .where(conditions);

      return {
        items,
        total: countResult?.count ?? 0,
      };
    }),

  /**
   * Get a single approval request by ID with its steps.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [request] = await db
        .select()
        .from(approvals)
        .where(eq(approvals.id, input.id))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval request not found" });
      }

      const steps = await db
        .select()
        .from(approvalSteps)
        .where(eq(approvalSteps.requestId, input.id))
        .orderBy(approvalSteps.stepOrder);

      return { ...request, steps };
    }),

  /**
   * Get count of pending approval requests.
   */
  getPendingCount: protectedProcedure.query(async () => {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(approvals)
      .where(eq(approvals.status, "pending"));

    return result?.count ?? 0;
  }),
});
