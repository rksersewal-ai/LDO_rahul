import type { UserRole } from "@/lib/mock-data/users";

export type Permission =
  | "view_documents"
  | "search"
  | "download"
  | "upload"
  | "create_work_records"
  | "create_pl"
  | "edit_bom"
  | "approve_documents"
  | "verify_work"
  | "manage_cases"
  | "manage_users"
  | "system_settings"
  | "view_audit";

/**
 * Role hierarchy (higher number = more permissions):
 * admin > supervisor > reviewer > engineer > viewer
 */
const ROLE_LEVEL: Record<UserRole, number> = {
  viewer: 1,
  engineer: 2,
  reviewer: 3,
  supervisor: 4,
  admin: 5,
};

/**
 * Permission matrix: maps each permission to the minimum role level required.
 */
const PERMISSION_MATRIX: Record<Permission, number> = {
  view_documents: 1, // viewer+
  search: 1, // viewer+
  download: 2, // engineer+
  upload: 2, // engineer+
  create_work_records: 2, // engineer+
  create_pl: 2, // engineer+
  edit_bom: 2, // engineer+
  approve_documents: 4, // supervisor+
  verify_work: 3, // reviewer+
  manage_cases: 4, // supervisor+
  manage_users: 5, // admin only
  system_settings: 5, // admin only
  view_audit: 4, // supervisor+
};

/**
 * Check if a role has permission to perform an action.
 */
export function hasPermission(role: UserRole, action: Permission): boolean {
  const userLevel = ROLE_LEVEL[role];
  const requiredLevel = PERMISSION_MATRIX[action];
  return userLevel >= requiredLevel;
}

/**
 * Check if roleA meets or exceeds the level of roleB.
 */
export function isRoleAtLeast(role: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  const level = ROLE_LEVEL[role];
  return (Object.entries(PERMISSION_MATRIX) as [Permission, number][])
    .filter(([, required]) => level >= required)
    .map(([perm]) => perm);
}
