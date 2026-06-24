import type { MockUser } from "./users";
import { MOCK_USERS } from "./users";

// --- System Health ---
export type ServiceStatus = "healthy" | "degraded" | "down";

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTime: number; // ms
  uptime: number; // percentage
  lastChecked: string;
  details: string;
}

export const MOCK_SYSTEM_HEALTH: ServiceHealth[] = [
  {
    name: "PostgreSQL Database",
    status: "healthy",
    responseTime: 2,
    uptime: 99.98,
    lastChecked: "2024-12-20T10:30:00Z",
    details: "Primary node active, 2 replicas in sync",
  },
  {
    name: "Redis Cache",
    status: "healthy",
    responseTime: 1,
    uptime: 99.99,
    lastChecked: "2024-12-20T10:30:00Z",
    details: "Cluster mode, 6 nodes, memory 45% used",
  },
  {
    name: "OCR Workers",
    status: "degraded",
    responseTime: 450,
    uptime: 97.2,
    lastChecked: "2024-12-20T10:29:55Z",
    details: "3/5 workers active, 2 restarting after OOM",
  },
  {
    name: "File Storage (NAS)",
    status: "healthy",
    responseTime: 8,
    uptime: 99.95,
    lastChecked: "2024-12-20T10:30:00Z",
    details: "RAID-6, 2.4 TB used of 10 TB, no errors",
  },
  {
    name: "Email Service (SMTP)",
    status: "healthy",
    responseTime: 120,
    uptime: 99.8,
    lastChecked: "2024-12-20T10:29:50Z",
    details: "Relay via railways.gov.in SMTP gateway",
  },
  {
    name: "Authentication (LDAP)",
    status: "healthy",
    responseTime: 15,
    uptime: 99.9,
    lastChecked: "2024-12-20T10:30:00Z",
    details: "Connected to AD controller, 156 active sessions",
  },
];

export interface SystemMetrics {
  totalUsers: number;
  activeSessions: number;
  documentsToday: number;
  ocrJobsToday: number;
  storageUsedGB: number;
  storageTotalGB: number;
  cpuUsage: number;
  memoryUsage: number;
  uptimeHours: number;
}

export const MOCK_SYSTEM_METRICS: SystemMetrics = {
  totalUsers: 156,
  activeSessions: 42,
  documentsToday: 23,
  ocrJobsToday: 47,
  storageUsedGB: 2400,
  storageTotalGB: 10000,
  cpuUsage: 34,
  memoryUsage: 67,
  uptimeHours: 2184,
};

// --- Extended User List for Admin ---
export const MOCK_ADMIN_USERS: MockUser[] = [
  ...MOCK_USERS,
  {
    id: "u-007-supervisor2",
    username: "supervisor2",
    email: "sde.bogie@ldo.railways.gov.in",
    password: "password123",
    name: "Shri N.K. Pandey",
    designation: "SDE/Bogie",
    department: "Mechanical",
    section: "Bogie Assembly",
    employeeId: "LDO-2024-007",
    phone: "+91-9876543216",
    role: "supervisor",
    isActive: true,
    lastLogin: "2024-12-19T16:00:00Z",
    passwordChangedAt: "2024-10-05T12:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-008-engineer3",
    username: "engineer3",
    email: "sse.brake@ldo.railways.gov.in",
    password: "password123",
    name: "Shri D.K. Mishra",
    designation: "SSE/Brake",
    department: "Mechanical",
    section: "Brake Systems",
    employeeId: "LDO-2024-008",
    phone: "+91-9876543217",
    role: "engineer",
    isActive: true,
    lastLogin: "2024-12-20T07:30:00Z",
    passwordChangedAt: "2024-11-10T09:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-009-viewer2",
    username: "viewer2",
    email: "tech.store@ldo.railways.gov.in",
    password: "password123",
    name: "Shri B.P. Tiwari",
    designation: "Tech./II",
    department: "Stores",
    section: "Material Planning",
    employeeId: "LDO-2024-009",
    phone: "+91-9876543218",
    role: "viewer",
    isActive: false,
    lastLogin: "2024-11-15T10:00:00Z",
    passwordChangedAt: "2024-07-20T10:00:00Z",
    forcePasswordChange: true,
    failedLoginAttempts: 5,
    lockedAt: "2024-11-14T16:00:00Z",
    lockedBy: "u-001-admin",
    lockReason: "Account compromised - suspicious activity detected",
  },
  {
    id: "u-010-reviewer2",
    username: "reviewer2",
    email: "je.elec@ldo.railways.gov.in",
    password: "password123",
    name: "Smt. R. Devi",
    designation: "JE/Electrical",
    department: "Electrical",
    section: "Control Systems",
    employeeId: "LDO-2024-010",
    phone: "+91-9876543219",
    role: "reviewer",
    isActive: true,
    lastLogin: "2024-12-20T09:45:00Z",
    passwordChangedAt: "2024-12-10T14:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-011-engineer4",
    username: "engineer4",
    email: "sse.traction@ldo.railways.gov.in",
    password: "password123",
    name: "Shri S.K. Das",
    designation: "SSE/Traction",
    department: "Electrical",
    section: "Traction Systems",
    employeeId: "LDO-2024-011",
    phone: "+91-9876543220",
    role: "engineer",
    isActive: true,
    lastLogin: "2024-12-20T08:15:00Z",
    passwordChangedAt: "2024-11-01T08:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 2,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-012-admin2",
    username: "admin2",
    email: "dy.cwe@ldo.railways.gov.in",
    password: "password123",
    name: "Shri T.K. Bansal",
    designation: "Dy.CWE/Design",
    department: "Design",
    section: "Loco Design Office",
    employeeId: "LDO-2024-012",
    phone: "+91-9876543221",
    role: "admin",
    isActive: true,
    lastLogin: "2024-12-20T10:00:00Z",
    passwordChangedAt: "2024-12-05T11:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
];

// --- Audit Log ---
export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "UPLOAD"
  | "DOWNLOAD"
  | "APPROVE"
  | "REJECT"
  | "OCR_START"
  | "OCR_COMPLETE"
  | "SETTINGS_CHANGE"
  | "USER_DEACTIVATE"
  | "ROLE_CHANGE"
  | "PASSWORD_RESET";

export type ResourceType =
  | "document"
  | "pl_item"
  | "work_record"
  | "user"
  | "case"
  | "approval"
  | "bom"
  | "settings"
  | "banner";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceTitle: string;
  ip: string;
  details: string;
  hashChain: string;
}

function generateHash(index: number): string {
  const chars = "abcdef0123456789";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[(index * 7 + i * 13) % chars.length];
  }
  return hash;
}

export const MOCK_AUDIT_LOG: AuditLogEntry[] = Array.from({ length: 50 }, (_, i) => {
  const actions: AuditAction[] = [
    "LOGIN",
    "UPLOAD",
    "CREATE",
    "UPDATE",
    "APPROVE",
    "DOWNLOAD",
    "OCR_START",
    "OCR_COMPLETE",
    "REJECT",
    "DELETE",
    "SETTINGS_CHANGE",
    "USER_DEACTIVATE",
    "ROLE_CHANGE",
    "PASSWORD_RESET",
    "LOGOUT",
  ];
  const resourceTypes: ResourceType[] = [
    "document",
    "pl_item",
    "work_record",
    "user",
    "case",
    "approval",
    "bom",
    "settings",
    "banner",
  ];
  const users = MOCK_USERS;
  const user = users[i % users.length];
  const action = actions[i % actions.length];
  const resourceType = resourceTypes[i % resourceTypes.length];

  const date = new Date("2024-12-20T10:00:00Z");
  date.setMinutes(date.getMinutes() - i * 15);

  return {
    id: `audit-${String(i + 1).padStart(3, "0")}`,
    timestamp: date.toISOString(),
    userId: user.id,
    userName: user.name,
    action,
    resourceType,
    resourceId: `${resourceType.toUpperCase()}-${String(100 + i).padStart(4, "0")}`,
    resourceTitle: `${resourceType.replace("_", " ")} #${100 + i}`,
    ip: `10.0.${Math.floor(i / 10)}.${(i % 254) + 1}`,
    details: getAuditDetails(action, resourceType, i),
    hashChain: generateHash(i),
  };
});

function getAuditDetails(action: AuditAction, resourceType: ResourceType, index: number): string {
  const detailsMap: Record<AuditAction, string> = {
    LOGIN: "User authenticated via LDAP",
    LOGOUT: "Session terminated normally",
    CREATE: `Created new ${resourceType.replace("_", " ")}`,
    UPDATE: `Modified ${resourceType.replace("_", " ")} fields: title, status`,
    DELETE: `Soft-deleted ${resourceType.replace("_", " ")}`,
    UPLOAD: `Uploaded file (${(index + 1) * 234}KB, SHA-256 verified)`,
    DOWNLOAD: `Downloaded file to local workstation`,
    APPROVE: `Approved with remarks: "Technically satisfactory"`,
    REJECT: `Rejected: "Requires revision per clause 4.2"`,
    OCR_START: `OCR job queued, priority: normal, pages: ${index + 3}`,
    OCR_COMPLETE: `OCR completed, confidence: ${85 + (index % 15)}%, pages: ${index + 3}`,
    SETTINGS_CHANGE: `Updated system setting: max_upload_size`,
    USER_DEACTIVATE: `User account deactivated by admin`,
    ROLE_CHANGE: `Role changed from viewer to engineer`,
    PASSWORD_RESET: `Password reset initiated by admin`,
  };
  return detailsMap[action];
}

// --- OCR Queue ---
export type OcrJobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface OcrQueueJob {
  id: string;
  documentId: string;
  documentNumber: string;
  documentTitle: string;
  status: OcrJobStatus;
  priority: "high" | "normal" | "low";
  pagesTotal: number;
  pagesProcessed: number;
  confidence: number | null;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null; // seconds
  error: string | null;
  retryCount: number;
  createdAt: string;
}

export const MOCK_OCR_QUEUE: OcrQueueJob[] = [
  {
    id: "ocr-001",
    documentId: "doc-001",
    documentNumber: "LDO/DRG/WAP-7/TM/001",
    documentTitle: "Traction Motor Assembly Drawing",
    status: "processing",
    priority: "high",
    pagesTotal: 12,
    pagesProcessed: 8,
    confidence: null,
    startedAt: "2024-12-20T10:15:00Z",
    completedAt: null,
    duration: null,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T10:14:30Z",
  },
  {
    id: "ocr-002",
    documentId: "doc-002",
    documentNumber: "LDO/SPEC/WAP-7/PS/002",
    documentTitle: "Power Supply Specification",
    status: "processing",
    priority: "normal",
    pagesTotal: 45,
    pagesProcessed: 22,
    confidence: null,
    startedAt: "2024-12-20T10:10:00Z",
    completedAt: null,
    duration: null,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T10:09:00Z",
  },
  {
    id: "ocr-003",
    documentId: "doc-003",
    documentNumber: "LDO/DRG/WAG-12/BRK/003",
    documentTitle: "Brake System Layout",
    status: "queued",
    priority: "normal",
    pagesTotal: 8,
    pagesProcessed: 0,
    confidence: null,
    startedAt: null,
    completedAt: null,
    duration: null,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T10:20:00Z",
  },
  {
    id: "ocr-004",
    documentId: "doc-004",
    documentNumber: "LDO/SPEC/WAP-7/EC/004",
    documentTitle: "Eligibility Criteria for Traction Converter",
    status: "queued",
    priority: "low",
    pagesTotal: 23,
    pagesProcessed: 0,
    confidence: null,
    startedAt: null,
    completedAt: null,
    duration: null,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T10:22:00Z",
  },
  {
    id: "ocr-005",
    documentId: "doc-005",
    documentNumber: "LDO/DRG/WAG-12/BOG/005",
    documentTitle: "Bogie Frame Drawing Rev-C",
    status: "failed",
    priority: "high",
    pagesTotal: 6,
    pagesProcessed: 4,
    confidence: null,
    startedAt: "2024-12-20T09:45:00Z",
    completedAt: null,
    duration: null,
    error: "Tesseract segfault on page 5 - corrupted image region",
    retryCount: 2,
    createdAt: "2024-12-20T09:44:00Z",
  },
  {
    id: "ocr-006",
    documentId: "doc-006",
    documentNumber: "LDO/SPEC/WAP-7/TM/006",
    documentTitle: "Traction Motor Test Report",
    status: "failed",
    priority: "normal",
    pagesTotal: 18,
    pagesProcessed: 0,
    confidence: null,
    startedAt: "2024-12-20T09:30:00Z",
    completedAt: null,
    duration: null,
    error: "File format unsupported: DWG requires conversion",
    retryCount: 1,
    createdAt: "2024-12-20T09:29:00Z",
  },
  {
    id: "ocr-007",
    documentId: "doc-007",
    documentNumber: "LDO/STD/GEN/QA/007",
    documentTitle: "Quality Assurance Standard",
    status: "completed",
    priority: "normal",
    pagesTotal: 34,
    pagesProcessed: 34,
    confidence: 94.2,
    startedAt: "2024-12-20T08:00:00Z",
    completedAt: "2024-12-20T08:12:00Z",
    duration: 720,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T07:59:00Z",
  },
  {
    id: "ocr-008",
    documentId: "doc-008",
    documentNumber: "LDO/DRG/WAP-7/CTRL/008",
    documentTitle: "Control Circuit Diagram",
    status: "completed",
    priority: "high",
    pagesTotal: 5,
    pagesProcessed: 5,
    confidence: 88.7,
    startedAt: "2024-12-20T09:00:00Z",
    completedAt: "2024-12-20T09:02:30Z",
    duration: 150,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T08:59:00Z",
  },
  {
    id: "ocr-009",
    documentId: "doc-009",
    documentNumber: "LDO/CERT/WAG-12/MAT/009",
    documentTitle: "Material Test Certificate",
    status: "completed",
    priority: "low",
    pagesTotal: 3,
    pagesProcessed: 3,
    confidence: 97.1,
    startedAt: "2024-12-20T07:30:00Z",
    completedAt: "2024-12-20T07:31:00Z",
    duration: 60,
    error: null,
    retryCount: 0,
    createdAt: "2024-12-20T07:29:00Z",
  },
  {
    id: "ocr-010",
    documentId: "doc-010",
    documentNumber: "LDO/DRG/WAP-7/AUX/010",
    documentTitle: "Auxiliary Power Unit Schematic",
    status: "cancelled",
    priority: "low",
    pagesTotal: 15,
    pagesProcessed: 0,
    confidence: null,
    startedAt: null,
    completedAt: null,
    duration: null,
    error: "Cancelled by admin - duplicate document",
    retryCount: 0,
    createdAt: "2024-12-20T06:00:00Z",
  },
];

// --- Storage Stats ---
export interface StorageCategory {
  category: string;
  sizeGB: number;
  fileCount: number;
  color: string;
}

export const MOCK_STORAGE_STATS: StorageCategory[] = [
  { category: "Drawings (DRG)", sizeGB: 1200, fileCount: 4560, color: "#d38738" },
  { category: "Specifications (SPEC)", sizeGB: 450, fileCount: 2340, color: "#3b82f6" },
  { category: "Test Reports", sizeGB: 320, fileCount: 1890, color: "#10b981" },
  { category: "Standards (STD)", sizeGB: 180, fileCount: 890, color: "#8b5cf6" },
  { category: "Certificates", sizeGB: 120, fileCount: 3400, color: "#f59e0b" },
  { category: "OCR Output", sizeGB: 85, fileCount: 8900, color: "#ef4444" },
  { category: "Temporary/Staging", sizeGB: 45, fileCount: 234, color: "#6b7280" },
];

// --- Duplicate Groups ---
export interface DuplicateDocument {
  id: string;
  documentNumber: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  revision: string;
}

export interface DuplicateGroup {
  id: string;
  fileHash: string;
  matchType: "exact_hash" | "three_point_hash" | "metadata_match";
  documentsCount: number;
  documents: DuplicateDocument[];
  totalWastedMB: number;
  detectedAt: string;
}

export const MOCK_DUPLICATE_GROUPS: DuplicateGroup[] = [
  {
    id: "dup-001",
    fileHash: "a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    matchType: "exact_hash",
    documentsCount: 3,
    documents: [
      {
        id: "doc-101",
        documentNumber: "LDO/DRG/WAP-7/TM/101",
        title: "Traction Motor General Arrangement",
        uploadedBy: "Shri P.K. Gupta",
        uploadedAt: "2024-10-15T09:00:00Z",
        fileSize: 4500000,
        revision: "A",
      },
      {
        id: "doc-102",
        documentNumber: "LDO/DRG/WAP-7/TM/101-copy",
        title: "Traction Motor GA (Copy)",
        uploadedBy: "Shri A.K. Verma",
        uploadedAt: "2024-11-02T14:30:00Z",
        fileSize: 4500000,
        revision: "A",
      },
      {
        id: "doc-103",
        documentNumber: "LDO/DRG/WAP-7/TM/101-backup",
        title: "TM Drawing Backup",
        uploadedBy: "Shri M.L. Yadav",
        uploadedAt: "2024-11-20T11:00:00Z",
        fileSize: 4500000,
        revision: "A",
      },
    ],
    totalWastedMB: 8.58,
    detectedAt: "2024-12-15T08:00:00Z",
  },
  {
    id: "dup-002",
    fileHash: "b4c3d9e2f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
    matchType: "three_point_hash",
    documentsCount: 2,
    documents: [
      {
        id: "doc-201",
        documentNumber: "LDO/SPEC/WAG-12/BRK/201",
        title: "Brake System Specification Rev-B",
        uploadedBy: "Shri D.K. Mishra",
        uploadedAt: "2024-09-10T10:00:00Z",
        fileSize: 2300000,
        revision: "B",
      },
      {
        id: "doc-202",
        documentNumber: "LDO/SPEC/WAG-12/BRK/201-v2",
        title: "Brake Spec (Re-uploaded)",
        uploadedBy: "Shri N.K. Pandey",
        uploadedAt: "2024-12-01T16:00:00Z",
        fileSize: 2300000,
        revision: "B",
      },
    ],
    totalWastedMB: 2.19,
    detectedAt: "2024-12-18T12:00:00Z",
  },
  {
    id: "dup-003",
    fileHash: "c5d4e0f3a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
    matchType: "exact_hash",
    documentsCount: 4,
    documents: [
      {
        id: "doc-301",
        documentNumber: "LDO/STD/GEN/WLD/301",
        title: "Welding Standard IS-2062",
        uploadedBy: "Shri R.K. Sharma",
        uploadedAt: "2024-06-01T09:00:00Z",
        fileSize: 890000,
        revision: "2019",
      },
      {
        id: "doc-302",
        documentNumber: "LDO/STD/GEN/WLD/301-a",
        title: "IS 2062 Welding Standard",
        uploadedBy: "Shri V.K. Singh",
        uploadedAt: "2024-07-15T14:00:00Z",
        fileSize: 890000,
        revision: "2019",
      },
      {
        id: "doc-303",
        documentNumber: "LDO/STD/MECH/WLD/301",
        title: "Welding Standard (Mech Section Copy)",
        uploadedBy: "Smt. K. Lakshmi",
        uploadedAt: "2024-08-20T10:30:00Z",
        fileSize: 890000,
        revision: "2019",
      },
      {
        id: "doc-304",
        documentNumber: "LDO/REF/WLD/IS2062",
        title: "Reference Copy - IS 2062",
        uploadedBy: "Shri M.L. Yadav",
        uploadedAt: "2024-09-05T08:00:00Z",
        fileSize: 890000,
        revision: "2019",
      },
    ],
    totalWastedMB: 2.55,
    detectedAt: "2024-12-10T06:00:00Z",
  },
  {
    id: "dup-004",
    fileHash: "d6e5f1a4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
    matchType: "metadata_match",
    documentsCount: 2,
    documents: [
      {
        id: "doc-401",
        documentNumber: "LDO/DRG/WAP-7/BOG/401",
        title: "Bogie Frame Side View",
        uploadedBy: "Shri A.K. Verma",
        uploadedAt: "2024-11-10T09:00:00Z",
        fileSize: 6700000,
        revision: "C",
      },
      {
        id: "doc-402",
        documentNumber: "LDO/DRG/WAP-7/BOG/401-scan",
        title: "Bogie Frame (Scanned Copy)",
        uploadedBy: "Shri B.P. Tiwari",
        uploadedAt: "2024-12-05T15:00:00Z",
        fileSize: 6850000,
        revision: "C",
      },
    ],
    totalWastedMB: 6.53,
    detectedAt: "2024-12-19T09:00:00Z",
  },
];

// --- System Settings ---
export interface SystemSetting {
  id: string;
  group: string;
  key: string;
  label: string;
  value: string;
  type: "text" | "number" | "boolean" | "select" | "json";
  options?: string[];
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export const MOCK_SETTINGS: SystemSetting[] = [
  {
    id: "set-001",
    group: "Upload",
    key: "max_upload_size_mb",
    label: "Max Upload Size (MB)",
    value: "100",
    type: "number",
    description: "Maximum allowed file upload size in megabytes",
    updatedAt: "2024-12-01T10:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-002",
    group: "Upload",
    key: "allowed_file_types",
    label: "Allowed File Types",
    value: "pdf,dwg,dxf,tiff,png,jpg,doc,docx,xls,xlsx",
    type: "text",
    description: "Comma-separated list of allowed file extensions",
    updatedAt: "2024-12-01T10:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-003",
    group: "OCR",
    key: "ocr_enabled",
    label: "OCR Processing Enabled",
    value: "true",
    type: "boolean",
    description: "Enable/disable automatic OCR processing of uploaded documents",
    updatedAt: "2024-12-15T08:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-004",
    group: "OCR",
    key: "ocr_confidence_threshold",
    label: "OCR Confidence Threshold (%)",
    value: "80",
    type: "number",
    description: "Minimum confidence score for OCR results to be accepted",
    updatedAt: "2024-12-10T14:00:00Z",
    updatedBy: "Shri T.K. Bansal",
  },
  {
    id: "set-005",
    group: "OCR",
    key: "ocr_max_workers",
    label: "Max OCR Workers",
    value: "5",
    type: "number",
    description: "Maximum concurrent OCR processing workers",
    updatedAt: "2024-11-20T09:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-006",
    group: "System",
    key: "maintenance_mode",
    label: "Maintenance Mode",
    value: "false",
    type: "boolean",
    description: "Put system in maintenance mode (only admins can access)",
    updatedAt: "2024-12-18T22:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-007",
    group: "System",
    key: "session_timeout_minutes",
    label: "Session Timeout (minutes)",
    value: "60",
    type: "number",
    description: "Auto-logout after inactivity period",
    updatedAt: "2024-11-01T10:00:00Z",
    updatedBy: "Shri T.K. Bansal",
  },
  {
    id: "set-008",
    group: "System",
    key: "default_document_category",
    label: "Default Document Category",
    value: "DRAWING",
    type: "select",
    options: [
      "DRAWING",
      "SPECIFICATION",
      "ELIGIBILITY_CRITERIA",
      "SCOPE_OF_SUPPLY",
      "SMI",
      "STANDARD",
      "TENDER",
      "SDR",
      "TEST_REPORT",
      "CERTIFICATE",
      "PROCEDURE",
      "OTHER",
    ],
    description: "Default category for newly uploaded documents",
    updatedAt: "2024-10-15T12:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-009",
    group: "Work Types",
    key: "work_categories",
    label: "Work Categories",
    value: JSON.stringify([
      { code: "DESIGN", name: "Design Work", targetDays: 30 },
      { code: "REVIEW", name: "Review/Checking", targetDays: 7 },
      { code: "MODIFICATION", name: "Modification", targetDays: 14 },
      { code: "TESTING", name: "Testing/Validation", targetDays: 21 },
      { code: "DOCUMENTATION", name: "Documentation", targetDays: 10 },
      { code: "PROCUREMENT", name: "Procurement Support", targetDays: 45 },
    ]),
    type: "json",
    description: "Work type categories with target completion days",
    updatedAt: "2024-12-05T09:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-010",
    group: "Work Types",
    key: "agencies_list",
    label: "Agencies List",
    value: JSON.stringify([
      "RDSO",
      "CLW",
      "BLW",
      "DLW",
      "ICF",
      "RCF",
      "MCF",
      "BEML",
      "BHEL",
      "ABB",
      "Siemens",
      "Alstom",
      "Medha",
      "Internal",
    ]),
    type: "json",
    description: "List of agencies/organizations for document and work assignment",
    updatedAt: "2024-11-15T11:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
  {
    id: "set-011",
    group: "Notifications",
    key: "email_notifications_enabled",
    label: "Email Notifications",
    value: "true",
    type: "boolean",
    description: "Enable system-wide email notifications",
    updatedAt: "2024-12-01T09:00:00Z",
    updatedBy: "Shri T.K. Bansal",
  },
  {
    id: "set-012",
    group: "Notifications",
    key: "digest_frequency",
    label: "Digest Frequency",
    value: "daily",
    type: "select",
    options: ["realtime", "hourly", "daily", "weekly"],
    description: "How often to send notification digest emails",
    updatedAt: "2024-11-20T14:00:00Z",
    updatedBy: "Shri R.K. Sharma",
  },
];

// --- Banners ---
export type BannerType = "info" | "warning" | "critical";

export interface Banner {
  id: string;
  message: string;
  type: BannerType;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
  targetRoles?: string[];
  actionLabel?: string;
  actionHref?: string;
}

export const MOCK_BANNERS: Banner[] = [
  {
    id: "banner-001",
    message: "Scheduled maintenance on Saturday, 10 PM to 2 AM IST. System may be unavailable.",
    type: "warning",
    isActive: true,
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2030-12-31T23:59:59Z",
    createdBy: "Shri R.K. Sharma",
    createdAt: "2024-12-18T10:00:00Z",
  },
  {
    id: "banner-002",
    message: "New OCR engine deployed. Please report any accuracy issues to IT support.",
    type: "info",
    isActive: true,
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2030-12-31T23:59:59Z",
    createdBy: "Shri T.K. Bansal",
    createdAt: "2024-12-15T09:00:00Z",
  },
  {
    id: "banner-003",
    message:
      "Critical: File storage reaching capacity. Please avoid uploading large files until expanded.",
    type: "critical",
    isActive: false,
    startDate: "2024-12-01T00:00:00Z",
    endDate: "2024-12-10T00:00:00Z",
    createdBy: "Shri R.K. Sharma",
    createdAt: "2024-12-01T08:00:00Z",
  },
];
