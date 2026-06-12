import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { pushToUser } from "@/lib/notifications/sse-registry";
import { getEffectiveSetting } from "@/lib/settings/get-effective-setting";

type NotificationType =
  | "approval_request"
  | "approval_decision"
  | "document_upload"
  | "document_comment"
  | "case_assigned"
  | "case_update"
  | "system";

interface CreateAndPushNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  workspaceId?: string;
  actionUrl?: string;
}

/**
 * Insert a notification into the database, push it via SSE to connected clients,
 * and optionally send an email if the user has email notifications enabled.
 */
export async function createAndPushNotification(
  params: CreateAndPushNotificationParams,
): Promise<void> {
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(notifications).values({
    id,
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.body,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    isRead: false,
    actionUrl: params.actionUrl ?? null,
    workspaceId: params.workspaceId ?? null,
    createdAt,
  });

  // Push SSE event to connected clients
  pushToUser(params.userId, {
    id,
    type: params.type,
    title: params.title,
    body: params.body,
    entityType: params.entityType,
    entityId: params.entityId,
    createdAt: createdAt.toISOString(),
  });

  // Check if email notifications are enabled for this user
  try {
    const emailEnabled = await getEffectiveSetting("notifications.email.enabled", {
      userId: params.userId,
    });
    if (emailEnabled === "true") {
      // Resolve userId to email address from the database
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, params.userId))
        .limit(1);

      if (user?.email) {
        const { sendEmail } = await import("@/lib/email/mailer");
        await sendEmail({
          to: user.email,
          subject: params.title,
          html: `<p>${params.body}</p>`,
        });
      }
    }
  } catch {
    // Silently ignore email failures - notification was still created
  }
}
