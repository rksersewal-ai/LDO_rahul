import { z } from "zod";
import {
  type Banner,
  MOCK_ADMIN_USERS,
  MOCK_AUDIT_LOG,
  MOCK_BANNERS,
  MOCK_DUPLICATE_GROUPS,
  MOCK_OCR_QUEUE,
  MOCK_SETTINGS,
  MOCK_STORAGE_STATS,
  MOCK_SYSTEM_HEALTH,
  MOCK_SYSTEM_METRICS,
  type OcrQueueJob,
  type SystemSetting,
} from "@/lib/mock-data/admin";
import type { MockUser } from "@/lib/mock-data/users";
import { adminProcedure, router } from "@/server/trpc";

// In-memory mutable stores
const users: MockUser[] = [...MOCK_ADMIN_USERS];
const ocrQueue: OcrQueueJob[] = [...MOCK_OCR_QUEUE];
const settings: SystemSetting[] = [...MOCK_SETTINGS];
const banners: Banner[] = [...MOCK_BANNERS];

export const adminRouter = router({
  // --- System Health ---
  getHealth: adminProcedure.query(() => {
    return {
      services: MOCK_SYSTEM_HEALTH,
      metrics: MOCK_SYSTEM_METRICS,
    };
  }),

  // --- User Management ---
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
    .query(({ input }) => {
      let filtered = [...users];
      if (input?.role) {
        filtered = filtered.filter((u) => u.role === input.role);
      }
      if (input?.department) {
        filtered = filtered.filter((u) => u.department === input.department);
      }
      if (input?.isActive !== undefined) {
        filtered = filtered.filter((u) => u.isActive === input.isActive);
      }
      if (input?.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(s) ||
            u.username.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s),
        );
      }
      return filtered;
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
    .mutation(({ input }) => {
      const newUser: MockUser = {
        id: `u-${Date.now()}`,
        ...input,
        isActive: true,
        lastLogin: null,
      };
      users.push(newUser);
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
    .mutation(({ input }) => {
      const idx = users.findIndex((u) => u.id === input.id);
      if (idx === -1) return null;
      const { id: _id, ...updates } = input;
      Object.assign(users[idx], updates);
      return users[idx];
    }),

  deactivateUser: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const idx = users.findIndex((u) => u.id === input.id);
    if (idx === -1) return null;
    users[idx].isActive = false;
    return users[idx];
  }),

  // --- OCR Queue ---
  getOcrQueue: adminProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input }) => {
      let filtered = [...ocrQueue];
      if (input?.status) {
        filtered = filtered.filter((j) => j.status === input.status);
      }
      const summary = {
        queued: ocrQueue.filter((j) => j.status === "queued").length,
        processing: ocrQueue.filter((j) => j.status === "processing").length,
        completed: ocrQueue.filter((j) => j.status === "completed").length,
        failed: ocrQueue.filter((j) => j.status === "failed").length,
        cancelled: ocrQueue.filter((j) => j.status === "cancelled").length,
      };
      return { jobs: filtered, summary };
    }),

  retryOcrJob: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const idx = ocrQueue.findIndex((j) => j.id === input.id);
    if (idx === -1) return null;
    ocrQueue[idx].status = "queued";
    ocrQueue[idx].error = null;
    ocrQueue[idx].retryCount += 1;
    ocrQueue[idx].pagesProcessed = 0;
    return ocrQueue[idx];
  }),

  cancelOcrJob: adminProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const idx = ocrQueue.findIndex((j) => j.id === input.id);
    if (idx === -1) return null;
    ocrQueue[idx].status = "cancelled";
    ocrQueue[idx].error = "Cancelled by admin";
    return ocrQueue[idx];
  }),

  // --- Storage ---
  getStorageStats: adminProcedure.query(() => {
    return {
      categories: MOCK_STORAGE_STATS,
      totalUsedGB: MOCK_SYSTEM_METRICS.storageUsedGB,
      totalCapacityGB: MOCK_SYSTEM_METRICS.storageTotalGB,
    };
  }),

  // --- Deduplication ---
  getDuplicateGroups: adminProcedure.query(() => {
    return MOCK_DUPLICATE_GROUPS;
  }),

  mergeDuplicates: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        keepDocumentId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      // Simulate merge by removing the group
      return {
        success: true,
        groupId: input.groupId,
        keptDocumentId: input.keepDocumentId,
        message: "Duplicates merged successfully. Other copies linked to primary.",
      };
    }),

  // --- Audit Log ---
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
    .query(({ input }) => {
      let filtered = [...MOCK_AUDIT_LOG];
      if (input?.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.userName.toLowerCase().includes(s) ||
            e.details.toLowerCase().includes(s) ||
            e.resourceTitle.toLowerCase().includes(s),
        );
      }
      if (input?.action) {
        filtered = filtered.filter((e) => e.action === input.action);
      }
      if (input?.userId) {
        filtered = filtered.filter((e) => e.userId === input.userId);
      }
      if (input?.resourceType) {
        filtered = filtered.filter((e) => e.resourceType === input.resourceType);
      }
      if (input?.dateFrom) {
        const dateFrom = input.dateFrom;
        filtered = filtered.filter((e) => e.timestamp >= dateFrom);
      }
      if (input?.dateTo) {
        const dateTo = input.dateTo;
        filtered = filtered.filter((e) => e.timestamp <= dateTo);
      }

      const total = filtered.length;
      const offset = input?.offset ?? 0;
      const limit = input?.limit ?? 20;
      const items = filtered.slice(offset, offset + limit);

      return { items, total, offset, limit, hashChainValid: true };
    }),

  // --- Settings ---
  getSettings: adminProcedure.query(() => {
    return settings;
  }),

  updateSetting: adminProcedure
    .input(
      z.object({
        id: z.string(),
        value: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const idx = settings.findIndex((s) => s.id === input.id);
      if (idx === -1) return null;
      settings[idx].value = input.value;
      settings[idx].updatedAt = new Date().toISOString();
      return settings[idx];
    }),

  // --- Banners ---
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
});
