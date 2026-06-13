import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { protectedProcedure, router } from "@/server/trpc";

export const notificationsRouter = router({
  /**
   * List notifications for the current user with optional filters.
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
        type: z
          .enum([
            "approval_request",
            "approval_decision",
            "document_upload",
            "document_comment",
            "case_assigned",
            "case_update",
            "system",
          ])
          .optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";

      const conditions = [eq(notifications.userId, userId)];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }
      if (input.type) {
        conditions.push(eq(notifications.type, input.type));
      }

      const whereClause = and(...conditions);

      const items = await db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause);

      return {
        items,
        total: totalResult?.count ?? 0,
      };
    }),

  /**
   * Get count of unread notifications for the current user.
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id ?? "system";

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return result?.count ?? 0;
  }),

  /**
   * Mark a single notification as read.
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";

      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, userId)));

      return { success: true };
    }),

  /**
   * Mark all unread notifications as read for the current user.
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user?.id ?? "system";

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return { success: true };
  }),

  /**
   * Dismiss (delete) a notification.
   */
  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";

      await db
        .delete(notifications)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, userId)));

      return { success: true };
    }),
});
