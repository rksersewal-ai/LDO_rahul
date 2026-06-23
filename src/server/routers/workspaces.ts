import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { userWorkspaces, workspaces } from "@/lib/db/schema";
import { protectedProcedure, router } from "@/server/trpc";

export const workspacesRouter = router({
  /**
   * List workspaces the current user belongs to via user_workspaces join.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id;
    if (!userId) return [];

    const rows = await db
      .select({
        workspaceId: userWorkspaces.workspaceId,
        role: userWorkspaces.role,
        isPrimary: userWorkspaces.isPrimary,
        assignedAt: userWorkspaces.assignedAt,
        id: workspaces.id,
        name: workspaces.name,
        code: workspaces.code,
        description: workspaces.description,
        orgId: workspaces.orgId,
        isActive: workspaces.isActive,
        storageQuotaGb: workspaces.storageQuotaGb,
      })
      .from(userWorkspaces)
      .innerJoin(workspaces, eq(userWorkspaces.workspaceId, workspaces.id))
      .where(eq(userWorkspaces.userId, userId));

    return rows;
  }),

  /**
   * Get workspace details if user has access.
   */
  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const userId = ctx.session.user?.id;
    if (!userId) return null;

    // Single query: join workspaces with user_workspaces filtering by both workspaceId AND userId
    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        code: workspaces.code,
        description: workspaces.description,
        orgId: workspaces.orgId,
        isActive: workspaces.isActive,
        storageQuotaGb: workspaces.storageQuotaGb,
        usedStorageBytes: workspaces.usedStorageBytes,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        userRole: userWorkspaces.role,
        isPrimary: userWorkspaces.isPrimary,
      })
      .from(workspaces)
      .innerJoin(
        userWorkspaces,
        and(eq(userWorkspaces.workspaceId, workspaces.id), eq(userWorkspaces.userId, userId)),
      )
      .where(eq(workspaces.id, input.id));

    const workspace = rows[0];
    if (!workspace) return null;

    return workspace;
  }),
});
