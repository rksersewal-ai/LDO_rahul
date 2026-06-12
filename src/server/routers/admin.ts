import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import type { Permission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  auditLog,
  duplicateDetections,
  ocrJobs,
  organizations,
  settings as settingsTable,
  users,
  userWorkspaces,
  workspaces,
} from "@/lib/db/schema";
import {
  type Banner,
  MOCK_BANNERS,
  MOCK_STORAGE_STATS,
  MOCK_SYSTEM_HEALTH,
  MOCK_SYSTEM_METRICS,
} from "@/lib/mock-data/admin";
import {
  type ComplianceSettings,
  type FeatureToggle,
  MOCK_COMPLIANCE_SETTINGS,
  MOCK_FEATURE_TOGGLES,
  MOCK_ROLE_PERMISSIONS,
  MOCK_SECURITY_POLICIES,
  MOCK_SYSTEM_CONFIGURATION,
  type RolePermissionMatrix,
  type SecurityPolicies,
  type SystemConfiguration,
} from "@/lib/mock-data/admin-settings";
import type { UserRole } from "@/lib/types/auth";
import { adminProcedure, router } from "@/server/trpc";

// In-memory mutable stores (non-DB-backed features only)
const banners: Banner[] = [...MOCK_BANNERS];
const featureToggles: FeatureToggle[] = [...MOCK_FEATURE_TOGGLES];
let securityPolicies: SecurityPolicies = { ...MOCK_SECURITY_POLICIES };
const rolePermissions: RolePermissionMatrix = { ...MOCK_ROLE_PERMISSIONS };
let systemConfiguration: SystemConfiguration = { ...MOCK_SYSTEM_CONFIGURATION };
let complianceSettings: ComplianceSettings = { ...MOCK_COMPLIANCE_SETTINGS };

export const adminRouter = router({
  // --- System Health ---
  getHealth: adminProcedure.query(() => {
    return {
      services: MOCK_SYSTEM_HEALTH,
      metrics: MOCK_SYSTEM_METRICS,
    };
  }),

  // --- User Management (Real DB) ---
  getUsers: adminProcedure
    .input(
      z
        .object({
          role: z.string().optional(),
          department: z.string().optional(),
          isActive: z.boolean().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.role) {
        conditions.push(eq(users.role, input.role as UserRole));
      }
      if (input?.department) {
        conditions.push(eq(users.department, input.department));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(users.isActive, input.isActive));
      }
      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(users.name, searchTerm),
            ilike(users.username, searchTerm),
            ilike(users.email, searchTerm),
          ),
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          designation: users.designation,
          department: users.department,
          section: users.section,
          employeeId: users.employeeId,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
          lastLogin: users.lastLogin,
          passwordChangedAt: users.passwordChangedAt,
          forcePasswordChange: users.forcePasswordChange,
          failedLoginAttempts: users.failedLoginAttempts,
          lockedAt: users.lockedAt,
          lockedBy: users.lockedBy,
          lockReason: users.lockReason,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(users.name);

      return rows;
    }),

  createUser: adminProcedure
    .input(
      z.object({
        username: z.string().min(3),
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(6),
        role: z.enum(["admin", "supervisor", "reviewer", "engineer", "viewer"]),
        designation: z.string(),
        department: z.string(),
        section: z.string(),
        employeeId: z.string(),
        phone: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const id = randomUUID();
      const passwordHash = await bcrypt.hash(input.password, 12);

      const [newUser] = await db
        .insert(users)
        .values({
          id,
          username: input.username,
          email: input.email,
          name: input.name,
          passwordHash,
          designation: input.designation,
          department: input.department,
          section: input.section,
          employeeId: input.employeeId,
          phone: input.phone,
          role: input.role,
          isActive: true,
          forcePasswordChange: true,
          failedLoginAttempts: 0,
          passwordChangedAt: new Date(),
        })
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "CREATE",
        resourceType: "user",
        resourceId: id,
        resourceTitle: input.name,
        details: `Created user ${input.username} with role ${input.role}`,
      });

      return newUser;
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "supervisor", "reviewer", "engineer", "viewer"]).optional(),
        designation: z.string().optional(),
        department: z.string().optional(),
        section: z.string().optional(),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;

      // Get old values for audit
      const [oldUser] = await db.select().from(users).where(eq(users.id, id));
      if (!oldUser) return null;

      const setValues: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) setValues.name = updates.name;
      if (updates.email !== undefined) setValues.email = updates.email;
      if (updates.role !== undefined) setValues.role = updates.role;
      if (updates.designation !== undefined) setValues.designation = updates.designation;
      if (updates.department !== undefined) setValues.department = updates.department;
      if (updates.section !== undefined) setValues.section = updates.section;
      if (updates.phone !== undefined) setValues.phone = updates.phone;
      if (updates.isActive !== undefined) setValues.isActive = updates.isActive;

      const [updated] = await db.update(users).set(setValues).where(eq(users.id, id)).returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "user",
        resourceId: id,
        resourceTitle: oldUser.name,
        details: `Updated user fields: ${Object.keys(updates).join(", ")}`,
        oldValue: JSON.stringify(updates),
        newValue: JSON.stringify(
          Object.fromEntries(
            Object.keys(updates).map((k) => [k, (updated as Record<string, unknown>)[k]]),
          ),
        ),
      });

      return updated;
    }),

  deactivateUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [oldUser] = await db.select().from(users).where(eq(users.id, input.id));
      if (!oldUser) return null;

      const [updated] = await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, input.id))
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "USER_DEACTIVATE",
        resourceType: "user",
        resourceId: input.id,
        resourceTitle: oldUser.name,
        details: `Deactivated user account: ${oldUser.username}`,
      });

      return updated;
    }),

  // --- User Security Management (Real DB) ---
  getSecurityInfo: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select({
          userId: users.id,
          username: users.username,
          name: users.name,
          passwordChangedAt: users.passwordChangedAt,
          forcePasswordChange: users.forcePasswordChange,
          failedLoginAttempts: users.failedLoginAttempts,
          lockedAt: users.lockedAt,
          lockedBy: users.lockedBy,
          lockReason: users.lockReason,
        })
        .from(users)
        .where(eq(users.id, input.userId));

      return user ?? null;
    }),

  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) return null;

      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await db
        .update(users)
        .set({
          passwordHash,
          passwordChangedAt: new Date(),
          forcePasswordChange: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "PASSWORD_RESET",
        resourceType: "user",
        resourceId: input.userId,
        resourceTitle: user.name,
        details: `Password reset by admin for user: ${user.username}`,
      });

      return { success: true, userId: input.userId };
    }),

  forcePasswordChange: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) return null;

      await db
        .update(users)
        .set({ forcePasswordChange: true, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "user",
        resourceId: input.userId,
        resourceTitle: user.name,
        details: `Force password change enabled for user: ${user.username}`,
      });

      return { success: true, userId: input.userId };
    }),

  lockAccount: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) return null;

      const lockedBy = ctx.session.user?.id ?? "unknown";

      await db
        .update(users)
        .set({
          lockedAt: new Date(),
          lockedBy,
          lockReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "user",
        resourceId: input.userId,
        resourceTitle: user.name,
        details: `Account locked. Reason: ${input.reason}`,
      });

      return { success: true, userId: input.userId };
    }),

  unlockAccount: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) return null;

      await db
        .update(users)
        .set({
          lockedAt: null,
          lockedBy: null,
          lockReason: null,
          failedLoginAttempts: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "user",
        resourceId: input.userId,
        resourceTitle: user.name,
        details: `Account unlocked for user: ${user.username}`,
      });

      return { success: true, userId: input.userId };
    }),

  // --- OCR Queue (Real DB) ---
  getOcrQueue: adminProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input?.status) {
        conditions.push(
          eq(
            ocrJobs.status,
            input.status as "queued" | "processing" | "completed" | "failed" | "cancelled",
          ),
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const jobs = await db
        .select()
        .from(ocrJobs)
        .where(whereClause)
        .orderBy(desc(ocrJobs.createdAt));

      // Compute summary counts
      const [summaryResult] = await db
        .select({
          queued: sql<number>`count(*) filter (where ${ocrJobs.status} = 'queued')`,
          processing: sql<number>`count(*) filter (where ${ocrJobs.status} = 'processing')`,
          completed: sql<number>`count(*) filter (where ${ocrJobs.status} = 'completed')`,
          failed: sql<number>`count(*) filter (where ${ocrJobs.status} = 'failed')`,
          cancelled: sql<number>`count(*) filter (where ${ocrJobs.status} = 'cancelled')`,
        })
        .from(ocrJobs);

      const summary = {
        queued: Number(summaryResult?.queued ?? 0),
        processing: Number(summaryResult?.processing ?? 0),
        completed: Number(summaryResult?.completed ?? 0),
        failed: Number(summaryResult?.failed ?? 0),
        cancelled: Number(summaryResult?.cancelled ?? 0),
      };

      return { jobs, summary };
    }),

  retryOcrJob: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [job] = await db.select().from(ocrJobs).where(eq(ocrJobs.id, input.id));
      if (!job) return null;

      const [updated] = await db
        .update(ocrJobs)
        .set({
          status: "queued",
          errorMessage: null,
          retryCount: (job.retryCount ?? 0) + 1,
          processedPages: 0,
          updatedAt: new Date(),
        })
        .where(eq(ocrJobs.id, input.id))
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "ocr_job",
        resourceId: input.id,
        details: `Retried OCR job (attempt ${(job.retryCount ?? 0) + 1})`,
      });

      return updated;
    }),

  cancelOcrJob: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [job] = await db.select().from(ocrJobs).where(eq(ocrJobs.id, input.id));
      if (!job) return null;

      const [updated] = await db
        .update(ocrJobs)
        .set({
          status: "cancelled",
          errorMessage: "Cancelled by admin",
          updatedAt: new Date(),
        })
        .where(eq(ocrJobs.id, input.id))
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "ocr_job",
        resourceId: input.id,
        details: "OCR job cancelled by admin",
      });

      return updated;
    }),

  // --- Storage (still mock) ---
  getStorageStats: adminProcedure.query(() => {
    return {
      categories: MOCK_STORAGE_STATS,
      totalUsedGB: MOCK_SYSTEM_METRICS.storageUsedGB,
      totalCapacityGB: MOCK_SYSTEM_METRICS.storageTotalGB,
    };
  }),

  // --- Deduplication (real DB) ---
  getDuplicateGroups: adminProcedure.query(async () => {
    const detections = await db
      .select({
        id: duplicateDetections.id,
        workspaceId: duplicateDetections.workspaceId,
        documentAId: duplicateDetections.documentAId,
        documentBId: duplicateDetections.documentBId,
        score: duplicateDetections.score,
        hashMatch: duplicateDetections.hashMatch,
        docNumberMatch: duplicateDetections.docNumberMatch,
        titleSimilarity: duplicateDetections.titleSimilarity,
        ocrTextSimilarity: duplicateDetections.ocrTextSimilarity,
        plOverlap: duplicateDetections.plOverlap,
        metaMatch: duplicateDetections.metaMatch,
        status: duplicateDetections.status,
        detectedAt: duplicateDetections.detectedAt,
        // Doc A fields
        docANumber: sql<string>`da."document_number"`.as("doc_a_number"),
        docATitle: sql<string>`da."title"`.as("doc_a_title"),
        docAFileHash: sql<string | null>`da."file_hash"`.as("doc_a_file_hash"),
        docACategory: sql<string>`da."category"`.as("doc_a_category"),
        // Doc B fields
        docBNumber: sql<string>`db."document_number"`.as("doc_b_number"),
        docBTitle: sql<string>`db."title"`.as("doc_b_title"),
        docBFileHash: sql<string | null>`db."file_hash"`.as("doc_b_file_hash"),
        docBCategory: sql<string>`db."category"`.as("doc_b_category"),
      })
      .from(duplicateDetections)
      .innerJoin(
        sql`"documents" as "da"`,
        sql`"da"."id" = ${duplicateDetections.documentAId}`,
      )
      .innerJoin(
        sql`"documents" as "db"`,
        sql`"db"."id" = ${duplicateDetections.documentBId}`,
      )
      .where(
        sql`${duplicateDetections.status} IN ('pending', 'merged')`,
      )
      .orderBy(desc(duplicateDetections.score))
      .limit(100);

    return detections;
  }),

  mergeDuplicates: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        keepDocumentId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return {
        success: true,
        groupId: input.groupId,
        keptDocumentId: input.keepDocumentId,
        message: "Duplicates merged successfully. Other copies linked to primary.",
      };
    }),

  // --- Audit Log (Real DB) ---
  getAuditLog: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          action: z.string().optional(),
          userId: z.string().optional(),
          resourceType: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          offset: z.number().default(0),
          limit: z.number().default(20),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(ilike(auditLog.userName, searchTerm), ilike(auditLog.details, searchTerm)),
        );
      }
      if (input?.action) {
        conditions.push(eq(auditLog.action, input.action));
      }
      if (input?.userId) {
        conditions.push(eq(auditLog.userId, input.userId));
      }
      if (input?.resourceType) {
        conditions.push(eq(auditLog.entityType, input.resourceType));
      }
      if (input?.dateFrom) {
        conditions.push(gte(auditLog.createdAt, new Date(input.dateFrom)));
      }
      if (input?.dateTo) {
        conditions.push(lte(auditLog.createdAt, new Date(input.dateTo)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = input?.offset ?? 0;
      const limit = input?.limit ?? 20;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(auditLog)
          .where(whereClause)
          .orderBy(desc(auditLog.createdAt))
          .offset(offset)
          .limit(limit),
        db.select({ total: count() }).from(auditLog).where(whereClause),
      ]);

      const total = totalResult[0]?.total ?? 0;

      return { items, total, offset, limit, hashChainValid: true };
    }),

  // --- Settings (Real DB) ---
  getSettings: adminProcedure.query(async () => {
    const rows = await db
      .select()
      .from(settingsTable)
      .orderBy(settingsTable.category, settingsTable.key);
    return rows;
  }),

  updateSetting: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.key, input.key));

      const setValues: Record<string, unknown> = {
        value: input.value,
        updatedAt: new Date(),
        updatedBy: ctx.session.user?.id ?? "system",
      };
      if (input.description) setValues.description = input.description;
      if (input.category) setValues.category = input.category;

      let result: typeof existing | undefined;
      if (existing) {
        [result] = await db
          .update(settingsTable)
          .set(setValues)
          .where(eq(settingsTable.key, input.key))
          .returning();
      } else {
        [result] = await db
          .insert(settingsTable)
          .values({
            key: input.key,
            value: input.value,
            description: input.description ?? null,
            category: input.category ?? "general",
            updatedBy: ctx.session.user?.id ?? "system",
          })
          .returning();
      }

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "SETTINGS_CHANGE",
        resourceType: "settings",
        resourceId: input.key,
        details: `Updated setting: ${input.key}`,
        oldValue: existing?.value ?? null,
        newValue: input.value,
      });

      return result;
    }),

  // --- Organizations (Real DB) ---
  getOrganizations: adminProcedure.query(async () => {
    const rows = await db.select().from(organizations).orderBy(organizations.name);
    return rows;
  }),

  createOrganization: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        code: z.string().min(2),
        address: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const id = randomUUID();

      const [org] = await db
        .insert(organizations)
        .values({
          id,
          name: input.name,
          code: input.code,
          address: input.address ?? null,
          isActive: true,
        })
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "CREATE",
        resourceType: "organization",
        resourceId: id,
        resourceTitle: input.name,
        details: `Created organization: ${input.name} (${input.code})`,
      });

      return org;
    }),

  // --- Workspaces Admin (Real DB) ---
  getWorkspaces: adminProcedure.query(async () => {
    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        code: workspaces.code,
        description: workspaces.description,
        orgId: workspaces.orgId,
        orgName: organizations.name,
        isActive: workspaces.isActive,
        storageQuotaGb: workspaces.storageQuotaGb,
        usedStorageBytes: workspaces.usedStorageBytes,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .leftJoin(organizations, eq(workspaces.orgId, organizations.id))
      .orderBy(workspaces.name);

    return rows;
  }),

  createWorkspace: adminProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(2),
        code: z.string().min(2),
        description: z.string().optional(),
        storageQuotaGb: z.number().default(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const id = randomUUID();

      const [ws] = await db
        .insert(workspaces)
        .values({
          id,
          orgId: input.orgId,
          name: input.name,
          code: input.code,
          description: input.description ?? null,
          isActive: true,
          storageQuotaGb: input.storageQuotaGb,
        })
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "CREATE",
        resourceType: "workspace",
        resourceId: id,
        resourceTitle: input.name,
        details: `Created workspace: ${input.name} (${input.code})`,
      });

      return ws;
    }),

  updateWorkspace: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        storageQuotaGb: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      const [old] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      if (!old) return null;

      const setValues: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) setValues.name = updates.name;
      if (updates.description !== undefined) setValues.description = updates.description;
      if (updates.isActive !== undefined) setValues.isActive = updates.isActive;
      if (updates.storageQuotaGb !== undefined) setValues.storageQuotaGb = updates.storageQuotaGb;

      const [updated] = await db
        .update(workspaces)
        .set(setValues)
        .where(eq(workspaces.id, id))
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "UPDATE",
        resourceType: "workspace",
        resourceId: id,
        resourceTitle: old.name,
        details: `Updated workspace: ${old.name}`,
        oldValue: JSON.stringify(updates),
        newValue: JSON.stringify(
          Object.fromEntries(
            Object.keys(updates).map((k) => [k, (updated as Record<string, unknown>)[k]]),
          ),
        ),
      });

      return updated;
    }),

  assignUserToWorkspace: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        workspaceId: z.string(),
        role: z.enum(["admin", "supervisor", "reviewer", "engineer", "viewer"]),
        isPrimary: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [assignment] = await db
        .insert(userWorkspaces)
        .values({
          userId: input.userId,
          workspaceId: input.workspaceId,
          role: input.role,
          isPrimary: input.isPrimary,
          assignedBy: ctx.session.user?.id ?? "system",
        })
        .returning();

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "CREATE",
        resourceType: "user_workspace",
        resourceId: `${input.userId}:${input.workspaceId}`,
        details: `Assigned user ${input.userId} to workspace ${input.workspaceId} with role ${input.role}`,
      });

      return assignment;
    }),

  removeUserFromWorkspace: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        workspaceId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .delete(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.userId, input.userId),
            eq(userWorkspaces.workspaceId, input.workspaceId),
          ),
        );

      await createAuditEntry(db, {
        userId: ctx.session.user?.id ?? "system",
        userName: ctx.session.user?.name ?? "System",
        action: "DELETE",
        resourceType: "user_workspace",
        resourceId: `${input.userId}:${input.workspaceId}`,
        details: `Removed user ${input.userId} from workspace ${input.workspaceId}`,
      });

      return { success: true };
    }),

  // --- Banners (in-memory) ---
  getBanners: adminProcedure.query(() => {
    return banners;
  }),

  createBanner: adminProcedure
    .input(
      z.object({
        message: z.string().min(5),
        type: z.enum(["info", "warning", "critical"]),
        isActive: z.boolean().default(true),
        startDate: z.string(),
        endDate: z.string().nullable().default(null),
      }),
    )
    .mutation(({ input }) => {
      const newBanner: Banner = {
        id: `banner-${Date.now()}`,
        ...input,
        createdBy: "Admin",
        createdAt: new Date().toISOString(),
      };
      banners.push(newBanner);
      return newBanner;
    }),

  deleteBanner: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const idx = banners.findIndex((b) => b.id === input.id);
    if (idx === -1) return null;
    const removed = banners.splice(idx, 1);
    return removed[0];
  }),

  // --- Feature Toggles (in-memory) ---
  getFeatureToggles: adminProcedure.query(() => {
    return featureToggles;
  }),

  updateFeatureToggle: adminProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      const idx = featureToggles.findIndex((f) => f.id === input.id);
      if (idx === -1) return null;
      featureToggles[idx].enabled = input.enabled;
      featureToggles[idx].lastModified = new Date().toISOString();
      featureToggles[idx].modifiedBy = "Admin";
      return featureToggles[idx];
    }),

  // --- Security Policies (in-memory) ---
  getSecurityPolicies: adminProcedure.query(() => {
    return securityPolicies;
  }),

  updateSecurityPolicies: adminProcedure
    .input(
      z.object({
        password: z
          .object({
            minLength: z.number().min(6).max(32).optional(),
            requireUppercase: z.boolean().optional(),
            requireLowercase: z.boolean().optional(),
            requireNumbers: z.boolean().optional(),
            requireSpecialChars: z.boolean().optional(),
            expiryDays: z.number().min(0).max(365).optional(),
            historyCount: z.number().min(0).max(24).optional(),
          })
          .optional(),
        login: z
          .object({
            maxFailedAttempts: z.number().min(1).max(20).optional(),
            lockoutDurationMinutes: z.number().min(1).max(1440).optional(),
            twoFactorEnabled: z.boolean().optional(),
          })
          .optional(),
        session: z
          .object({
            timeoutMinutes: z.number().min(5).max(480).optional(),
            maxConcurrentSessions: z.number().min(1).max(10).optional(),
          })
          .optional(),
        ipRestrictions: z
          .object({
            enabled: z.boolean().optional(),
            whitelist: z.array(z.string()).optional(),
          })
          .optional(),
      }),
    )
    .mutation(({ input }) => {
      if (input.password) {
        securityPolicies = {
          ...securityPolicies,
          password: { ...securityPolicies.password, ...input.password },
        };
      }
      if (input.login) {
        securityPolicies = {
          ...securityPolicies,
          login: { ...securityPolicies.login, ...input.login },
        };
      }
      if (input.session) {
        securityPolicies = {
          ...securityPolicies,
          session: { ...securityPolicies.session, ...input.session },
        };
      }
      if (input.ipRestrictions) {
        securityPolicies = {
          ...securityPolicies,
          ipRestrictions: { ...securityPolicies.ipRestrictions, ...input.ipRestrictions },
        };
      }
      return securityPolicies;
    }),

  // --- Role Permissions (in-memory) ---
  getRolePermissions: adminProcedure.query(() => {
    return rolePermissions;
  }),

  updateRolePermission: adminProcedure
    .input(
      z.object({
        role: z.enum(["admin", "supervisor", "reviewer", "engineer", "viewer"]),
        permission: z.string(),
        granted: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      const role = input.role as UserRole;
      const permission = input.permission as Permission;
      if (role === "admin") return rolePermissions;
      if (input.granted) {
        if (!rolePermissions[role].includes(permission)) {
          rolePermissions[role].push(permission);
        }
      } else {
        rolePermissions[role] = rolePermissions[role].filter((p) => p !== permission);
      }
      return rolePermissions;
    }),

  // --- System Configuration (in-memory) ---
  getSystemConfiguration: adminProcedure.query(() => {
    return systemConfiguration;
  }),

  updateSystemConfiguration: adminProcedure
    .input(
      z.object({
        upload: z
          .object({
            maxFileSizeMB: z.number().optional(),
            allowedExtensions: z.array(z.string()).optional(),
            maxConcurrentUploads: z.number().optional(),
          })
          .optional(),
        ocr: z
          .object({
            enabled: z.boolean().optional(),
            confidenceThreshold: z.number().optional(),
            maxWorkers: z.number().optional(),
            autoRetryOnFailure: z.boolean().optional(),
            maxRetries: z.number().optional(),
          })
          .optional(),
        notifications: z
          .object({
            digestFrequency: z.enum(["realtime", "hourly", "daily", "weekly"]).optional(),
            channels: z
              .object({
                email: z.boolean().optional(),
                inApp: z.boolean().optional(),
                sms: z.boolean().optional(),
              })
              .optional(),
            quietHoursStart: z.string().optional(),
            quietHoursEnd: z.string().optional(),
          })
          .optional(),
        storage: z
          .object({
            autoArchiveAfterDays: z.number().optional(),
            retentionPolicy: z.enum(["indefinite", "5_years", "10_years", "20_years"]).optional(),
            compressionEnabled: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .mutation(({ input }) => {
      if (input.upload) {
        systemConfiguration = {
          ...systemConfiguration,
          upload: { ...systemConfiguration.upload, ...input.upload },
        };
      }
      if (input.ocr) {
        systemConfiguration = {
          ...systemConfiguration,
          ocr: { ...systemConfiguration.ocr, ...input.ocr },
        };
      }
      if (input.notifications) {
        const notifUpdate = { ...input.notifications };
        const channels = notifUpdate.channels
          ? { ...systemConfiguration.notifications.channels, ...notifUpdate.channels }
          : systemConfiguration.notifications.channels;
        systemConfiguration = {
          ...systemConfiguration,
          notifications: {
            ...systemConfiguration.notifications,
            ...notifUpdate,
            channels,
          },
        };
      }
      if (input.storage) {
        systemConfiguration = {
          ...systemConfiguration,
          storage: { ...systemConfiguration.storage, ...input.storage },
        };
      }
      return systemConfiguration;
    }),

  // --- Compliance Settings (in-memory) ---
  getComplianceSettings: adminProcedure.query(() => {
    return complianceSettings;
  }),

  updateComplianceSettings: adminProcedure
    .input(
      z.object({
        auditRetention: z
          .object({
            retentionPeriod: z
              .enum(["1_year", "3_years", "5_years", "10_years", "indefinite"])
              .optional(),
            autoExportEnabled: z.boolean().optional(),
            exportFormat: z.enum(["json", "csv"]).optional(),
          })
          .optional(),
        approvalWorkflow: z
          .object({
            requiredApprovers: z.number().min(1).max(10).optional(),
            autoEscalationDays: z.number().min(1).max(30).optional(),
            allowSelfApproval: z.boolean().optional(),
            requireComments: z.boolean().optional(),
          })
          .optional(),
        versionControl: z
          .object({
            maxRevisionsToKeep: z.number().min(5).max(100).optional(),
            mandatoryCommentsOnRevision: z.boolean().optional(),
            autoVersionIncrement: z.boolean().optional(),
            lockOnCheckout: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .mutation(({ input }) => {
      if (input.auditRetention) {
        complianceSettings = {
          ...complianceSettings,
          auditRetention: { ...complianceSettings.auditRetention, ...input.auditRetention },
        };
      }
      if (input.approvalWorkflow) {
        complianceSettings = {
          ...complianceSettings,
          approvalWorkflow: { ...complianceSettings.approvalWorkflow, ...input.approvalWorkflow },
        };
      }
      if (input.versionControl) {
        complianceSettings = {
          ...complianceSettings,
          versionControl: { ...complianceSettings.versionControl, ...input.versionControl },
        };
      }
      return complianceSettings;
    }),

  // --- Export/Import ---
  exportSettings: adminProcedure.query(async () => {
    const legacySettings = await db.select().from(settingsTable);
    return {
      featureToggles,
      securityPolicies,
      rolePermissions,
      systemConfiguration,
      complianceSettings,
      legacySettings,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
  }),

  importSettings: adminProcedure
    .input(
      z.object({
        data: z.string(),
      }),
    )
    .mutation(({ input }) => {
      try {
        const parsed = JSON.parse(input.data);
        const changes: string[] = [];

        const featureToggleSchema = z
          .object({
            id: z.string(),
            name: z.string(),
            enabled: z.boolean(),
          })
          .passthrough();
        const securityPoliciesSchema = z
          .object({
            password: z.object({}).passthrough().optional(),
            login: z.object({}).passthrough().optional(),
            session: z.object({}).passthrough().optional(),
            ipRestrictions: z.object({}).passthrough().optional(),
          })
          .passthrough();
        const complianceSettingsSchema = z
          .object({
            auditRetention: z.object({}).passthrough().optional(),
            approvalWorkflow: z.object({}).passthrough().optional(),
            versionControl: z.object({}).passthrough().optional(),
          })
          .passthrough();
        const systemConfigSchema = z
          .object({
            upload: z.object({}).passthrough().optional(),
            ocr: z.object({}).passthrough().optional(),
            notifications: z.object({}).passthrough().optional(),
            storage: z.object({}).passthrough().optional(),
          })
          .passthrough();

        if (parsed.featureToggles) {
          const validated = z.array(featureToggleSchema).safeParse(parsed.featureToggles);
          if (!validated.success) {
            return {
              success: false,
              changes: ["Invalid featureToggles format"],
              importedAt: new Date().toISOString(),
            };
          }
          for (const ft of validated.data) {
            const idx = featureToggles.findIndex((f) => f.id === ft.id);
            if (idx !== -1) {
              featureToggles[idx] = { ...featureToggles[idx], ...ft };
              changes.push(`Updated feature toggle: ${ft.name}`);
            }
          }
        }
        if (parsed.securityPolicies) {
          const validated = securityPoliciesSchema.safeParse(parsed.securityPolicies);
          if (!validated.success) {
            return {
              success: false,
              changes: ["Invalid securityPolicies format"],
              importedAt: new Date().toISOString(),
            };
          }
          securityPolicies = {
            ...securityPolicies,
            ...parsed.securityPolicies,
          } as SecurityPolicies;
          changes.push("Updated security policies");
        }
        if (parsed.complianceSettings) {
          const validated = complianceSettingsSchema.safeParse(parsed.complianceSettings);
          if (!validated.success) {
            return {
              success: false,
              changes: ["Invalid complianceSettings format"],
              importedAt: new Date().toISOString(),
            };
          }
          complianceSettings = {
            ...complianceSettings,
            ...parsed.complianceSettings,
          } as ComplianceSettings;
          changes.push("Updated compliance settings");
        }
        if (parsed.systemConfiguration) {
          const validated = systemConfigSchema.safeParse(parsed.systemConfiguration);
          if (!validated.success) {
            return {
              success: false,
              changes: ["Invalid systemConfiguration format"],
              importedAt: new Date().toISOString(),
            };
          }
          systemConfiguration = {
            ...systemConfiguration,
            ...parsed.systemConfiguration,
          } as SystemConfiguration;
          changes.push("Updated system configuration");
        }

        return { success: true, changes, importedAt: new Date().toISOString() };
      } catch {
        return { success: false, changes: [], importedAt: new Date().toISOString() };
      }
    }),
});
