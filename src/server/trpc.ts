import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/types/auth";

export async function createContext() {
  const session = await auth();
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Requires authentication - any logged-in user.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: { session: ctx.session },
  });
});

/**
 * Requires role >= engineer (engineer, reviewer, supervisor, admin).
 */
export const engineerProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  const role = ctx.session.user.role as UserRole;
  if (!isRoleAtLeast(role, "engineer")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requires engineer role or higher",
    });
  }
  return next({
    ctx: { session: ctx.session },
  });
});

/**
 * Requires role >= supervisor (supervisor, admin).
 */
export const supervisorProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  const role = ctx.session.user.role as UserRole;
  if (!isRoleAtLeast(role, "supervisor")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requires supervisor role or higher",
    });
  }
  return next({
    ctx: { session: ctx.session },
  });
});

/**
 * Requires admin role.
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  const role = ctx.session.user.role as UserRole;
  if (role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requires admin role",
    });
  }
  return next({
    ctx: { session: ctx.session },
  });
});
