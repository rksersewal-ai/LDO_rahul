import type { Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/types/auth";

// --- Feature Toggles ---
export interface FeatureToggle {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  lastModified: string;
  modifiedBy: string;
}

export const MOCK_FEATURE_TOGGLES: FeatureToggle[] = [
  {
    id: "ft-001",
    name: "OCR Processing",
    key: "ocr_processing",
    description: "Automatic optical character recognition for uploaded documents",
    enabled: true,
    lastModified: "2024-12-15T08:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
  {
    id: "ft-002",
    name: "Email Notifications",
    key: "email_notifications",
    description: "System-wide email notifications for approvals, assignments, and alerts",
    enabled: true,
    lastModified: "2024-12-01T09:00:00Z",
    modifiedBy: "Shri T.K. Bansal",
  },
  {
    id: "ft-003",
    name: "Document Approval Workflow",
    key: "approval_workflow",
    description: "Multi-step approval workflow for document submissions and revisions",
    enabled: true,
    lastModified: "2024-11-20T14:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
  {
    id: "ft-004",
    name: "Case Management",
    key: "case_management",
    description: "Track and manage engineering cases linked to documents and work records",
    enabled: true,
    lastModified: "2024-12-10T10:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
  {
    id: "ft-005",
    name: "BOM Module",
    key: "bom_module",
    description: "Bill of Materials management with part hierarchy and revision tracking",
    enabled: true,
    lastModified: "2024-12-05T09:00:00Z",
    modifiedBy: "Shri T.K. Bansal",
  },
  {
    id: "ft-006",
    name: "Transmittals",
    key: "transmittals",
    description: "Generate and track document transmittal letters to external agencies",
    enabled: false,
    lastModified: "2024-11-15T11:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
  {
    id: "ft-007",
    name: "Deduplication Scanner",
    key: "dedup_scanner",
    description: "Automated detection of duplicate documents using hash and metadata matching",
    enabled: true,
    lastModified: "2024-12-18T08:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
  {
    id: "ft-008",
    name: "Bulk Upload",
    key: "bulk_upload",
    description: "Upload multiple documents simultaneously with batch metadata assignment",
    enabled: true,
    lastModified: "2024-12-12T16:00:00Z",
    modifiedBy: "Shri T.K. Bansal",
  },
  {
    id: "ft-009",
    name: "Search Analytics",
    key: "search_analytics",
    description: "Track search patterns and provide insights on frequently accessed documents",
    enabled: false,
    lastModified: "2024-11-01T10:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
  {
    id: "ft-010",
    name: "Large Drawing Viewer",
    key: "large_drawing_viewer",
    description:
      "Enhanced viewer for large-format engineering drawings with pan, zoom, and annotation",
    enabled: false,
    lastModified: "2024-12-20T09:00:00Z",
    modifiedBy: "Shri T.K. Bansal",
  },
  {
    id: "ft-011",
    name: "AI Suggestions",
    key: "ai_suggestions",
    description:
      "AI-powered suggestions for document metadata, tagging, and related document discovery",
    enabled: false,
    lastModified: "2024-12-22T11:00:00Z",
    modifiedBy: "Shri R.K. Sharma",
  },
];

// --- Security Policies ---
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
  historyCount: number;
}

export interface LoginPolicy {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  twoFactorEnabled: boolean;
}

export interface SessionPolicy {
  timeoutMinutes: number;
  maxConcurrentSessions: number;
}

export interface IpRestrictions {
  enabled: boolean;
  whitelist: string[];
}

export interface SecurityPolicies {
  password: PasswordPolicy;
  login: LoginPolicy;
  session: SessionPolicy;
  ipRestrictions: IpRestrictions;
}

export const MOCK_SECURITY_POLICIES: SecurityPolicies = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    expiryDays: 90,
    historyCount: 5,
  },
  login: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    twoFactorEnabled: false,
  },
  session: {
    timeoutMinutes: 60,
    maxConcurrentSessions: 3,
  },
  ipRestrictions: {
    enabled: false,
    whitelist: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
  },
};

// --- Role Permission Matrix ---
export type RolePermissionMatrix = Record<UserRole, Permission[]>;

export const MOCK_ROLE_PERMISSIONS: RolePermissionMatrix = {
  admin: [
    "view_documents",
    "search",
    "download",
    "upload",
    "create_work_records",
    "create_pl",
    "edit_bom",
    "approve_documents",
    "verify_work",
    "manage_cases",
    "manage_users",
    "system_settings",
    "view_audit",
  ],
  supervisor: [
    "view_documents",
    "search",
    "download",
    "upload",
    "create_work_records",
    "create_pl",
    "edit_bom",
    "approve_documents",
    "verify_work",
    "manage_cases",
    "view_audit",
  ],
  reviewer: [
    "view_documents",
    "search",
    "download",
    "upload",
    "create_work_records",
    "create_pl",
    "edit_bom",
    "verify_work",
  ],
  engineer: [
    "view_documents",
    "search",
    "download",
    "upload",
    "create_work_records",
    "create_pl",
    "edit_bom",
  ],
  viewer: ["view_documents", "search"],
};

// --- System Configuration ---
export interface UploadConfig {
  maxFileSizeMB: number;
  allowedExtensions: string[];
  maxConcurrentUploads: number;
}

export interface OcrConfig {
  enabled: boolean;
  confidenceThreshold: number;
  maxWorkers: number;
  autoRetryOnFailure: boolean;
  maxRetries: number;
}

export interface NotificationConfig {
  digestFrequency: "realtime" | "hourly" | "daily" | "weekly";
  channels: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface StorageConfig {
  autoArchiveAfterDays: number;
  retentionPolicy: "indefinite" | "5_years" | "10_years" | "20_years";
  compressionEnabled: boolean;
}

export interface SystemConfiguration {
  upload: UploadConfig;
  ocr: OcrConfig;
  notifications: NotificationConfig;
  storage: StorageConfig;
}

export const MOCK_SYSTEM_CONFIGURATION: SystemConfiguration = {
  upload: {
    maxFileSizeMB: 100,
    allowedExtensions: ["pdf", "dwg", "dxf", "tiff", "png", "jpg", "doc", "docx", "xls", "xlsx"],
    maxConcurrentUploads: 5,
  },
  ocr: {
    enabled: true,
    confidenceThreshold: 80,
    maxWorkers: 5,
    autoRetryOnFailure: true,
    maxRetries: 3,
  },
  notifications: {
    digestFrequency: "daily",
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    quietHoursStart: "22:00",
    quietHoursEnd: "06:00",
  },
  storage: {
    autoArchiveAfterDays: 365,
    retentionPolicy: "indefinite",
    compressionEnabled: true,
  },
};

// --- Compliance Settings ---
export interface AuditRetention {
  retentionPeriod: "1_year" | "3_years" | "5_years" | "10_years" | "indefinite";
  autoExportEnabled: boolean;
  exportFormat: "json" | "csv";
}

export interface ApprovalWorkflowConfig {
  requiredApprovers: number;
  autoEscalationDays: number;
  allowSelfApproval: boolean;
  requireComments: boolean;
}

export interface VersionControlPolicy {
  maxRevisionsToKeep: number;
  mandatoryCommentsOnRevision: boolean;
  autoVersionIncrement: boolean;
  lockOnCheckout: boolean;
}

export interface ComplianceSettings {
  auditRetention: AuditRetention;
  approvalWorkflow: ApprovalWorkflowConfig;
  versionControl: VersionControlPolicy;
}

export const MOCK_COMPLIANCE_SETTINGS: ComplianceSettings = {
  auditRetention: {
    retentionPeriod: "10_years",
    autoExportEnabled: true,
    exportFormat: "json",
  },
  approvalWorkflow: {
    requiredApprovers: 2,
    autoEscalationDays: 7,
    allowSelfApproval: false,
    requireComments: true,
  },
  versionControl: {
    maxRevisionsToKeep: 50,
    mandatoryCommentsOnRevision: true,
    autoVersionIncrement: true,
    lockOnCheckout: false,
  },
};
