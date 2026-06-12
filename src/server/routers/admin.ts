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
import type { Permission } from "@/lib/auth/permissions";
import type { MockUser, UserRole } from "@/lib/mock-data/users";
import { adminProcedure, router } from "@/server/trpc";

// In-memory mutable stores
const users: MockUser[] = [...MOCK_ADMIN_USERS];
const ocrQueue: OcrQueueJob[] = [...MOCK_OCR_QUEUE];
const settings: SystemSetting[] = [...MOCK_SETTINGS];
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

  // --- Feature Toggles ---
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

  // --- Security Policies ---
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

  // --- Role Permissions ---
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
      if (role === "admin") return rolePermissions; // admin always has all
      if (input.granted) {
        if (!rolePermissions[role].includes(permission)) {
          rolePermissions[role].push(permission);
        }
      } else {
        rolePermissions[role] = rolePermissions[role].filter((p) => p !== permission);
      }
      return rolePermissions;
    }),

  // --- System Configuration ---
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
            retentionPolicy: z
              .enum(["indefinite", "5_years", "10_years", "20_years"])
              .optional(),
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

  // --- Compliance Settings ---
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
  exportSettings: adminProcedure.query(() => {
    return {
      featureToggles,
      securityPolicies,
      rolePermissions,
      systemConfiguration,
      complianceSettings,
      legacySettings: settings,
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

        if (parsed.featureToggles) {
          for (const ft of parsed.featureToggles) {
            const idx = featureToggles.findIndex((f) => f.id === ft.id);
            if (idx !== -1) {
              featureToggles[idx] = { ...featureToggles[idx], ...ft };
              changes.push(`Updated feature toggle: ${ft.name}`);
            }
          }
        }
        if (parsed.securityPolicies) {
          securityPolicies = { ...securityPolicies, ...parsed.securityPolicies };
          changes.push("Updated security policies");
        }
        if (parsed.complianceSettings) {
          complianceSettings = { ...complianceSettings, ...parsed.complianceSettings };
          changes.push("Updated compliance settings");
        }
        if (parsed.systemConfiguration) {
          systemConfiguration = { ...systemConfiguration, ...parsed.systemConfiguration };
          changes.push("Updated system configuration");
        }

        return { success: true, changes, importedAt: new Date().toISOString() };
      } catch {
        return { success: false, changes: [], importedAt: new Date().toISOString() };
      }
    }),
});
