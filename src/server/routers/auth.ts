import { MOCK_USERS } from "@/lib/mock-data/users";
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
      },
    };
  }),

  /**
   * Get the full profile of the authenticated user from mock data.
   */
  getProfile: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return null;

    // Return everything except the password
    const { password: _, ...profile } = user;
    return profile;
  }),
});
