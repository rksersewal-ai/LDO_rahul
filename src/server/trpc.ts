import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/types/auth";

export async function createContext() {
  const session = await auth();
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const userFriendlyMessages: Record<string, string> = {
      INTERNAL_SERVER_ERROR: "An unexpected error occurred. Please try again.",
      TIMEOUT: "Request timed out. Please try again.",
      TOO_MANY_REQUESTS: "Too many requests. Please wait a moment.",
      BAD_REQUEST: "Invalid request. Please check your input.",
      NOT_FOUND: "The requested resource was not found.",
      UNAUTHORIZED: "You are not authorized. Please log in.",
      FORBIDDEN: "You do not have permission to perform this action.",
      PRECONDITION_FAILED: "A required condition was not met.",
    };

    return {
      ...shape,
      message: userFriendlyMessages[error.code] ?? shape.message,
      data: {
        ...shape.data,
        originalMessage: shape.message,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Procedures that are allowed even when forcePasswordChange is true.
 */
const FORCE_PASSWORD_CHANGE_ALLOWED_PROCEDURES = new Set([
  "auth.changePassword",
  "auth.getSession",
]);

/**
 * Middleware that enforces forcePasswordChange: blocks all procedures
 * except auth.changePassword and auth.getSession when the flag is set.
 */
const enforcePasswordChange = t.middleware(async ({ ctx, next, path }) => {
  if (ctx.session?.user?.forcePasswordChange) {
    if (!FORCE_PASSWORD_CHANGE_ALLOWED_PROCEDURES.has(path)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Password change required. Please change your password before continuing.",
      });
    }
  }
  return next({ ctx });
});

/**
 * Requires authentication - any logged-in user.
 */
export const protectedProcedure = t.procedure.use(enforcePasswordChange).use(async ({ ctx, next }) => {
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
export const engineerProcedure = t.procedure.use(enforcePasswordChange).use(async ({ ctx, next }) => {
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
export const supervisorProcedure = t.procedure.use(enforcePasswordChange).use(async ({ ctx, next }) => {
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
export const adminProcedure = t.procedure.use(enforcePasswordChange).use(async ({ ctx, next }) => {
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
