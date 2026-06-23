import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import { logError } from "@/lib/logging/structured-logger";
import type { UserRole } from "@/lib/types/auth";
import { checkRateLimit } from "@/server/middleware/rate-limit";

export async function createContext(req?: Request) {
  const session = await auth();
  if (req) {
    // CSRF defense: reject any cross-origin browser request. We validate the
    // Origin against the request's own Host (so it works on any LAN host/IP
    // without depending on NEXTAUTH_URL) plus any explicitly configured origin.
    // Requests without an Origin header (e.g. server-to-server, some GETs) are
    // allowed through and still gated by session auth in the procedures.
    const origin = req.headers.get("origin");
    if (origin) {
      const normalizedOrigin = origin.replace(/\/$/, "");
      const allowed = new Set<string>();

      const host = req.headers.get("host");
      if (host) {
        allowed.add(`https://${host}`);
        allowed.add(`http://${host}`);
      }
      const configured = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
      if (configured) {
        allowed.add(configured.replace(/\/$/, ""));
      }

      if (!allowed.has(normalizedOrigin)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid origin" });
      }
    }
  }
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error, path }) {
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

    // Log INTERNAL_SERVER_ERROR to structured logger
    if (error.code === "INTERNAL_SERVER_ERROR") {
      logError(
        "Internal server error in tRPC procedure",
        {
          path,
          code: error.code,
        },
        error.cause instanceof Error ? error.cause : error,
      );
    }

    // Preserve custom messages from TRPCError; only use generic fallback
    // when the message is the default code-based message (e.g. "BAD_REQUEST")
    const genericFallback = userFriendlyMessages[error.code];
    const hasCustomMessage = shape.message && shape.message !== error.code;
    const message = hasCustomMessage ? shape.message : (genericFallback ?? shape.message);

    return {
      ...shape,
      message,
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
  "auth.signOut",
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
 * Rate limit middleware (per-user, 100 requests per 60-second sliding window).
 */
const rateLimit = t.middleware(async ({ ctx, next }) => {
  await checkRateLimit(ctx.session?.user?.id);
  return next({ ctx });
});

/**
 * Requires authentication - any logged-in user.
 */
export const protectedProcedure = t.procedure
  .use(enforcePasswordChange)
  .use(rateLimit)
  .use(async ({ ctx, next }) => {
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
export const engineerProcedure = t.procedure
  .use(enforcePasswordChange)
  .use(rateLimit)
  .use(async ({ ctx, next }) => {
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
export const supervisorProcedure = t.procedure
  .use(enforcePasswordChange)
  .use(rateLimit)
  .use(async ({ ctx, next }) => {
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
export const adminProcedure = t.procedure
  .use(enforcePasswordChange)
  .use(rateLimit)
  .use(async ({ ctx, next }) => {
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
