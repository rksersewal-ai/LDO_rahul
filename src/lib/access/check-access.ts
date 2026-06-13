import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documentLegalHolds, legalHolds } from "@/lib/db/schema";

export interface CheckDocumentAccessParams {
  userWorkspaceId: string;
  userClearanceLevel: number;
  documentWorkspaceId: string | null;
  documentClearanceRequired: number;
  isAdmin: boolean;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks whether a user can access a given document based on:
 * 1. Workspace isolation (document must belong to user's workspace unless admin)
 * 2. Clearance level (user clearance must be >= document's required clearance)
 */
export function checkDocumentAccess(params: CheckDocumentAccessParams): AccessResult {
  const {
    userWorkspaceId,
    userClearanceLevel,
    documentWorkspaceId,
    documentClearanceRequired,
    isAdmin,
  } = params;

  // Check workspace isolation
  if (!isAdmin && documentWorkspaceId && documentWorkspaceId !== userWorkspaceId) {
    return {
      allowed: false,
      reason: "Document belongs to a different workspace",
    };
  }

  // Check clearance level
  if (userClearanceLevel < documentClearanceRequired) {
    return {
      allowed: false,
      reason: "Insufficient clearance level to access this document",
    };
  }

  return { allowed: true };
}

/**
 * Checks whether a document is currently under an active legal hold.
 */
export async function isDocumentUnderHold(documentId: string): Promise<boolean> {
  const rows = await db
    .select({ holdId: documentLegalHolds.holdId })
    .from(documentLegalHolds)
    .innerJoin(legalHolds, eq(documentLegalHolds.holdId, legalHolds.id))
    .where(
      and(
        eq(documentLegalHolds.documentId, documentId),
        eq(legalHolds.status, "active"),
      ),
    )
    .limit(1);

  return rows.length > 0;
}
