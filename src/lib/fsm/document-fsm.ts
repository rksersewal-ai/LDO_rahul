import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import type { Database } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import type { UserRole } from "@/lib/types/auth";

/**
 * Document status type matching the database enum values.
 */
export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "under_review"
  | "approved"
  | "rejected"
  | "superseded"
  | "archived";

/**
 * Transitions map: for each status, an array of valid next statuses.
 * "archived" can be reached from any status (supervisor+ only).
 */
const TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ["pending_review"],
  pending_review: ["under_review"],
  under_review: ["approved", "rejected"],
  approved: ["superseded", "archived"],
  rejected: ["draft"],
  superseded: ["archived"],
  archived: [],
};

/**
 * Transitions that require supervisor role or higher.
 */
const SUPERVISOR_ONLY_TARGETS: DocumentStatus[] = ["archived", "rejected"];

/**
 * User-friendly labels for transition targets (used by UI).
 */
export const TRANSITION_LABELS: Record<DocumentStatus, string> = {
  draft: "Return to Draft",
  pending_review: "Submit for Review",
  under_review: "Begin Review",
  approved: "Approve",
  rejected: "Reject",
  superseded: "Supersede",
  archived: "Mark Obsolete",
};

/**
 * Returns array of allowed next statuses for the given current status and user role.
 * "archived" is available from any non-archived status for supervisor+ users.
 */
export function getValidTransitions(currentStatus: string, userRole: string): DocumentStatus[] {
  const status = currentStatus as DocumentStatus;
  const role = userRole as UserRole;

  // Get standard transitions for this status
  const standardTransitions = TRANSITIONS[status] ?? [];

  // "archived" can be reached from any status (supervisor+ only)
  const isSupervisorPlus = isRoleAtLeast(role, "supervisor");

  const results: DocumentStatus[] = [];

  for (const target of standardTransitions) {
    if (SUPERVISOR_ONLY_TARGETS.includes(target)) {
      if (isSupervisorPlus) {
        results.push(target);
      }
    } else {
      results.push(target);
    }
  }

  // Add "archived" from any non-archived status for supervisor+
  if (isSupervisorPlus && status !== "archived" && !results.includes("archived")) {
    results.push("archived");
  }

  return results;
}

/**
 * Checks if a transition from one status to another is allowed for the given role.
 */
export function canTransition(from: string, to: string, role: string): boolean {
  const validTargets = getValidTransitions(from, role);
  return validTargets.includes(to as DocumentStatus);
}

/**
 * Context required for executeTransition.
 */
export interface TransitionContext {
  db: Database;
  userId: string;
  userName: string;
  workspaceId: string;
  userRole: string;
}

/**
 * Validates the transition, updates document status in DB, creates an audit entry,
 * and returns the updated document.
 * Throws TRPCError PRECONDITION_FAILED if the transition is invalid.
 */
export async function executeTransition(
  documentId: string,
  newStatus: string,
  ctx: TransitionContext,
) {
  const { db: database, userId, userName, workspaceId, userRole } = ctx;

  // Fetch current document
  const [current] = await database
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.workspaceId, workspaceId),
        eq(documents.isDeleted, 0),
      ),
    );

  if (!current) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
  }

  const currentStatus = current.status;

  // Validate the transition
  if (!canTransition(currentStatus, newStatus, userRole)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
    });
  }

  // Perform the update
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  // If transitioning to approved, also set approvedBy and approvedAt
  if (newStatus === "approved") {
    updateData.approvedBy = userId;
    updateData.approvedAt = new Date();
  }

  const [updated] = await database
    .update(documents)
    .set(updateData)
    .where(and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)))
    .returning();

  // Create audit entry
  await createAuditEntry(database, {
    userId,
    userName,
    action: "document.transition",
    resourceType: "document",
    resourceId: documentId,
    resourceTitle: updated.title,
    details: `Status changed from ${currentStatus} to ${newStatus}`,
    oldValue: JSON.stringify({ status: currentStatus }),
    newValue: JSON.stringify({ status: newStatus }),
    workspaceId,
  });

  return updated;
}
