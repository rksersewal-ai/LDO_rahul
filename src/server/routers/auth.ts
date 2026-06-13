import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc";

export const authRouter = router({
  /**
   * Get the current session - returns null if not authenticated.
   */
  getSession: publicProcedure.query(({ ctx }) => {
    if (!ctx.session?.user) return null;
    return {
      user: {
        id: ctx.session.user.id,
        name: ctx.session.user.name,
        email: ctx.session.user.email,
        role: ctx.session.user.role,
        department: ctx.session.user.department,
        designation: ctx.session.user.designation,
        workspaceId: (ctx.session.user as Record<string, unknown>).workspaceId ?? null,
        clearanceLevel: (ctx.session.user as Record<string, unknown>).clearanceLevel ?? null,
      },
    };
  }),

  /**
   * Get the full profile of the authenticated user from the database.
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) return null;

    // Return everything except the password hash
    const { passwordHash: _, ...profile } = user;
    return profile;
  }),

  /**
   * Change password mutation - verifies current password, hashes new one,
   * updates DB, and clears forcePasswordChange flag.
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get current user
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect" });
      }

      // Hash new password and update
      const newHash = await bcrypt.hash(input.newPassword, 12);
      await db
        .update(users)
        .set({
          passwordHash: newHash,
          forcePasswordChange: false,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),
});
