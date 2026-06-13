import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import type { Banner } from "@/lib/mock-data/admin";
import { MOCK_BANNERS } from "@/lib/mock-data/admin";
import { getEffectiveSetting } from "@/lib/settings/get-effective-setting";
import { adminProcedure, protectedProcedure, router, supervisorProcedure } from "@/server/trpc";

const scopeValues = ["system", "organization", "workspace", "user"] as const;
const dataTypeValues = ["string", "number", "boolean", "json"] as const;

export const settingsRouter = router({
  /**
   * Get the effective value of a setting for the current user context.
   */
  get: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id;
      const workspaceId = (ctx.session.user as Record<string, unknown>)?.workspaceId as string | undefined;
      const orgId = (ctx.session.user as Record<string, unknown>)?.organizationId as string | undefined;

      const value = await getEffectiveSetting(input.key, {
        userId,
        workspaceId,
        orgId,
      });

      return { key: input.key, value };
    }),

  /**
   * Get all settings for a given scope and optional scopeId.
   * Auth rules: system/organization -> admin, workspace -> supervisor+, user -> own userId only.
   */
  getAll: protectedProcedure
    .input(
      z.object({
        scope: z.enum(scopeValues),
        scopeId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id;
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as string | undefined;

      // Enforce authorization based on scope
      if (input.scope === "system" || input.scope === "organization") {
        if (userRole !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can view system or organization settings.",
          });
        }
      } else if (input.scope === "workspace") {
        if (userRole !== "admin" && userRole !== "supervisor") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only supervisors or admins can view workspace settings.",
          });
        }
      } else if (input.scope === "user") {
        // Users can only view their own settings
        if (input.scopeId && input.scopeId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own user settings.",
          });
        }
      }

      const conditions = [eq(settings.scope, input.scope)];

      if (input.scopeId) {
        conditions.push(eq(settings.scopeId, input.scopeId));
      } else if (input.scope === "user") {
        // Default to own user ID for user scope
        conditions.push(eq(settings.scopeId, userId ?? ""));
      } else {
        conditions.push(isNull(settings.scopeId));
      }

      const rows = await db
        .select()
        .from(settings)
        .where(and(...conditions));

      return rows;
    }),

  /**
   * Set (upsert) a setting value.
   * Auth rules: system/organization -> admin, workspace -> supervisor+, user -> any authenticated.
   */
  set: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        scope: z.enum(scopeValues),
        scopeId: z.string().optional(),
        dataType: z.enum(dataTypeValues).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as string | undefined;

      // Enforce authorization based on scope
      if (input.scope === "system" || input.scope === "organization") {
        if (userRole !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can modify system or organization settings.",
          });
        }
      } else if (input.scope === "workspace") {
        if (userRole !== "admin" && userRole !== "supervisor") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only supervisors or admins can modify workspace settings.",
          });
        }
      } else if (input.scope === "user") {
        // Users can only set their own settings
        if (input.scopeId && input.scopeId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only modify your own user settings.",
          });
        }
      }

      const scopeId = input.scope === "user" ? (input.scopeId ?? userId) : (input.scopeId ?? null);
      const id = nanoid();

      await db
        .insert(settings)
        .values({
          id,
          scope: input.scope,
          scopeId,
          key: input.key,
          value: input.value,
          dataType: input.dataType ?? "string",
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [settings.scope, settings.scopeId, settings.key],
          set: {
            value: input.value,
            dataType: input.dataType ?? "string",
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

      await createAuditEntry(db, {
        userId,
        userName,
        action: "SETTINGS_SET",
        resourceType: "setting",
        resourceId: `${input.scope}:${scopeId ?? "null"}:${input.key}`,
        resourceTitle: input.key,
        details: `Set ${input.scope} setting "${input.key}" to "${input.value}"`,
        newValue: input.value,
      });

      return { success: true, key: input.key, scope: input.scope };
    }),

  /**
   * Reset (delete) a setting override.
   * Same auth rules as set.
   */
  reset: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        scope: z.enum(scopeValues),
        scopeId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id ?? "system";
      const userName = ctx.session.user?.name ?? "System";
      const userRole = (ctx.session.user as Record<string, unknown>)?.role as string | undefined;

      // Enforce authorization based on scope
      if (input.scope === "system" || input.scope === "organization") {
        if (userRole !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can reset system or organization settings.",
          });
        }
      } else if (input.scope === "workspace") {
        if (userRole !== "admin" && userRole !== "supervisor") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only supervisors or admins can reset workspace settings.",
          });
        }
      } else if (input.scope === "user") {
        if (input.scopeId && input.scopeId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only reset your own user settings.",
          });
        }
      }

      const scopeId = input.scope === "user" ? (input.scopeId ?? userId) : (input.scopeId ?? null);

      const conditions = [
        eq(settings.scope, input.scope),
        eq(settings.key, input.key),
      ];

      if (scopeId) {
        conditions.push(eq(settings.scopeId, scopeId));
      } else {
        conditions.push(isNull(settings.scopeId));
      }

      await db.delete(settings).where(and(...conditions));

      await createAuditEntry(db, {
        userId,
        userName,
        action: "SETTINGS_RESET",
        resourceType: "setting",
        resourceId: `${input.scope}:${scopeId ?? "null"}:${input.key}`,
        resourceTitle: input.key,
        details: `Reset ${input.scope} setting "${input.key}" to default`,
      });

      return { success: true, key: input.key, scope: input.scope };
    }),

  /**
   * Get all user-scope settings for the current user.
   */
  getUserPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const rows = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.scope, "user"),
          eq(settings.scopeId, userId),
        ),
      );

    return rows;
  }),

  /**
   * Set a user preference (upsert user-scope setting for current user).
   */
  setUserPreference: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.id;
      const userName = ctx.session.user?.name ?? "System";
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const id = nanoid();

      await db
        .insert(settings)
        .values({
          id,
          scope: "user",
          scopeId: userId,
          key: input.key,
          value: input.value,
          dataType: "string",
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [settings.scope, settings.scopeId, settings.key],
          set: {
            value: input.value,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

      await createAuditEntry(db, {
        userId,
        userName,
        action: "SETTINGS_SET_USER_PREF",
        resourceType: "setting",
        resourceId: `user:${userId}:${input.key}`,
        resourceTitle: input.key,
        details: `Set user preference "${input.key}" to "${input.value}"`,
        newValue: input.value,
      });

      return { success: true, key: input.key };
    }),

  /**
   * Get active banners for all authenticated users.
   * Reads from the settings table (key='banners', scope='system') and filters
   * to only return banners where isActive=true and the current date falls within
   * the startDate/endDate range.
   */
  getActiveBanners: protectedProcedure.query(async () => {
    const BANNERS_KEY = "banners";
    const now = new Date();

    // Read banners from settings table
    const [row] = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.scope, "system"),
          eq(settings.key, BANNERS_KEY),
        ),
      );

    let allBanners: Banner[];
    if (row) {
      try {
        allBanners = JSON.parse(row.value) as Banner[];
      } catch {
        allBanners = [...MOCK_BANNERS];
      }
    } else {
      allBanners = [...MOCK_BANNERS];
    }

    // Filter to active banners within date range
    const activeBanners = allBanners.filter((banner) => {
      if (!banner.isActive) return false;

      const startDate = new Date(banner.startDate);
      if (now < startDate) return false;

      if (banner.endDate) {
        const endDate = new Date(banner.endDate);
        if (now > endDate) return false;
      }

      return true;
    });

    return activeBanners;
  }),
});
