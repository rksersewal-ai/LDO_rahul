import { type Job, Worker } from "bullmq";
import { and, eq, inArray, isNull, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  documents,
  notifications,
  recordDeclarations,
  users,
  userWorkspaces,
} from "@/lib/db/schema";
import { logError, logInfo } from "@/lib/logging/structured-logger";
import type { RetentionScanPayload } from "./retention-queue";

/** Roles that should be notified when records reach their retention expiry. */
const RECORDS_REVIEW_ROLES = ["records_manager", "admin"] as const;

/**
 * Find the user IDs that should receive disposition-review notifications for a
 * given workspace: records managers + admins, whether assigned via the user's
 * primary workspace or via the user_workspaces membership table.
 */
async function getReviewRecipients(workspaceId: string): Promise<string[]> {
  const [primary, membership] = await Promise.all([
    db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.workspaceId, workspaceId),
          eq(users.isActive, true),
          inArray(users.role, [...RECORDS_REVIEW_ROLES]),
        ),
      ),
    db
      .select({ id: userWorkspaces.userId })
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, workspaceId),
          inArray(userWorkspaces.role, [...RECORDS_REVIEW_ROLES]),
        ),
      ),
  ]);

  return [...new Set([...primary.map((r) => r.id), ...membership.map((r) => r.id)])];
}

/**
 * Process a retention scan: find declarations whose retention period has expired
 * but which have NOT been destroyed, and notify the records managers responsible
 * for each workspace so they can review disposition.
 *
 * NO-HARD-DELETE POLICY: this job NEVER deletes or destroys anything. It only
 * routes expired records into the disposition-review queue via notifications.
 * Notification IDs are deterministic so repeated scans never double-notify.
 */
export async function processRetentionJob(job: Job<RetentionScanPayload>): Promise<void> {
  const now = new Date();
  const scopeWorkspaceId = job.data.workspaceId;

  const expired = await db
    .select({
      id: recordDeclarations.id,
      documentId: recordDeclarations.documentId,
      workspaceId: recordDeclarations.workspaceId,
      retentionExpiresAt: recordDeclarations.retentionExpiresAt,
      documentTitle: documents.title,
      documentNumber: documents.documentNumber,
    })
    .from(recordDeclarations)
    .leftJoin(documents, eq(documents.id, recordDeclarations.documentId))
    .where(
      and(
        isNull(recordDeclarations.destroyedAt),
        lte(recordDeclarations.retentionExpiresAt, now),
        scopeWorkspaceId ? eq(recordDeclarations.workspaceId, scopeWorkspaceId) : undefined,
      ),
    );

  if (expired.length === 0) {
    logInfo("[retention] No expired records pending disposition", {
      workspaceId: scopeWorkspaceId,
    });
    return;
  }

  // Resolve recipients once per workspace.
  const recipientsByWorkspace = new Map<string, string[]>();
  for (const decl of expired) {
    if (!recipientsByWorkspace.has(decl.workspaceId)) {
      recipientsByWorkspace.set(decl.workspaceId, await getReviewRecipients(decl.workspaceId));
    }
  }

  const rows: (typeof notifications.$inferInsert)[] = [];
  for (const decl of expired) {
    const recipients = recipientsByWorkspace.get(decl.workspaceId) ?? [];
    for (const userId of recipients) {
      rows.push({
        // Deterministic id => idempotent across repeated scans (one per user+record).
        id: `retention-${decl.id}-${userId}`,
        userId,
        type: "system",
        title: "Record retention expired",
        message: `"${decl.documentTitle ?? decl.documentNumber ?? decl.documentId}" has reached the end of its retention period and is awaiting disposition review.`,
        entityType: "record_declaration",
        entityId: decl.id,
        actionUrl: "/admin/records",
        workspaceId: decl.workspaceId,
        isRead: false,
        createdAt: now,
      });
    }
  }

  let notified = 0;
  if (rows.length > 0) {
    const inserted = await db
      .insert(notifications)
      .values(rows)
      .onConflictDoNothing({ target: notifications.id })
      .returning({ id: notifications.id });
    notified = inserted.length;
  }

  logInfo("[retention] Disposition review scan complete", {
    workspaceId: scopeWorkspaceId,
    expiredRecords: expired.length,
    newNotifications: notified,
  });
}

/**
 * Create and return a BullMQ Worker for the 'retention-scan' queue.
 */
export function createRetentionWorker(): Worker<RetentionScanPayload> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const worker = new Worker<RetentionScanPayload>("retention-scan", processRetentionJob, {
    connection: {
      host: new URL(redisUrl).hostname,
      port: Number(new URL(redisUrl).port) || 6379,
      maxRetriesPerRequest: null,
    },
    concurrency: 1,
  });

  worker.on("failed", (job, err) => {
    logError("[retention] Retention scan job failed", { jobId: job?.id }, err);
  });

  return worker;
}
