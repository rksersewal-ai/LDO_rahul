export type UserRole =
  | "admin"
  | "supervisor"
  | "reviewer"
  | "engineer"
  | "viewer"
  | "classification_officer"
  | "records_manager"
  | "legal_hold_officer"
  | "auditor";

export interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  designation: string;
  department: string;
  section: string;
  employeeId: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  passwordChangedAt: string | null;
  forcePasswordChange: boolean;
  failedLoginAttempts: number;
  lockedAt: string | null;
  lockedBy: string | null;
  lockReason: string | null;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "u-001-admin",
    username: "admin",
    email: "cwe.design@ldo.railways.gov.in",
    password: "password123",
    name: "Shri R.K. Sharma",
    designation: "CWE/Design",
    department: "Design",
    section: "Loco Design Office",
    employeeId: "LDO-2024-001",
    phone: "+91-9876543210",
    role: "admin",
    isActive: true,
    lastLogin: "2024-12-20T10:30:00Z",
    passwordChangedAt: "2024-11-15T09:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-002-supervisor",
    username: "supervisor",
    email: "srsde.mech@ldo.railways.gov.in",
    password: "password123",
    name: "Shri A.K. Verma",
    designation: "Sr.SDE/Mech",
    department: "Mechanical",
    section: "Bogie Design",
    employeeId: "LDO-2024-002",
    phone: "+91-9876543211",
    role: "supervisor",
    isActive: true,
    lastLogin: "2024-12-19T15:45:00Z",
    passwordChangedAt: "2024-10-20T14:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 1,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-003-engineer",
    username: "engineer",
    email: "sse.design@ldo.railways.gov.in",
    password: "password123",
    name: "Shri P.K. Gupta",
    designation: "SSE/Design",
    department: "Design",
    section: "Traction Motor",
    employeeId: "LDO-2024-003",
    phone: "+91-9876543212",
    role: "engineer",
    isActive: true,
    lastLogin: "2024-12-20T09:15:00Z",
    passwordChangedAt: "2024-12-01T10:00:00Z",
    forcePasswordChange: true,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-004-reviewer",
    username: "reviewer",
    email: "je.design@ldo.railways.gov.in",
    password: "password123",
    name: "Shri V.K. Singh",
    designation: "JE/Design",
    department: "Design",
    section: "Electrical Systems",
    employeeId: "LDO-2024-004",
    phone: "+91-9876543213",
    role: "reviewer",
    isActive: true,
    lastLogin: "2024-12-18T11:00:00Z",
    passwordChangedAt: "2024-09-10T08:30:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 3,
    lockedAt: "2024-12-19T14:00:00Z",
    lockedBy: "u-001-admin",
    lockReason: "Multiple failed login attempts detected",
  },
  {
    id: "u-005-viewer",
    username: "viewer",
    email: "tech.clerk@ldo.railways.gov.in",
    password: "password123",
    name: "Shri M.L. Yadav",
    designation: "Tech./III",
    department: "Records",
    section: "Document Control",
    employeeId: "LDO-2024-005",
    phone: "+91-9876543214",
    role: "viewer",
    isActive: true,
    lastLogin: "2024-12-17T14:30:00Z",
    passwordChangedAt: "2024-08-05T11:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
  {
    id: "u-006-engineer2",
    username: "engineer2",
    email: "sse.elec@ldo.railways.gov.in",
    password: "password123",
    name: "Smt. K. Lakshmi",
    designation: "SSE/Electrical",
    department: "Electrical",
    section: "Power Electronics",
    employeeId: "LDO-2024-006",
    phone: "+91-9876543215",
    role: "engineer",
    isActive: true,
    lastLogin: "2024-12-20T08:00:00Z",
    passwordChangedAt: "2024-11-28T16:00:00Z",
    forcePasswordChange: false,
    failedLoginAttempts: 0,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
  },
];
