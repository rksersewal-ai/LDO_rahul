import { TRPCError } from "@trpc/server";
import type { UserRole } from "@/lib/types/auth";

export type Permission =
  | "documents.view"
  | "documents.create"
  | "documents.classify"
  | "pl.create"
  | "pl.change_status"
  | "bom.edit"
  | "bom.lock"
  | "legal_hold.manage"
  | "records.manage"
  | "approvals.approve"
  | "admin.users"
  | "audit.view";

/**
 * Permission matrix: maps each permission to an array of roles that are allowed.
 */
const PERMISSION_MATRIX: Record<Permission, readonly UserRole[]> = {
  "documents.view": ["viewer", "engineer", "reviewer", "supervisor", "admin", "auditor"],
  "documents.create": ["engineer", "reviewer", "supervisor", "admin"],
  "documents.classify": ["classification_officer", "supervisor", "admin"],
  "pl.create": ["engineer", "supervisor", "admin"],
  "pl.change_status": ["supervisor", "admin"],
  "bom.edit": ["engineer", "supervisor", "admin"],
  "bom.lock": ["supervisor", "admin"],
  "legal_hold.manage": ["legal_hold_officer", "admin"],
  "records.manage": ["records_manager", "admin"],
  "approvals.approve": ["reviewer", "supervisor", "admin"],
  "admin.users": ["admin"],
  "audit.view": ["admin", "auditor"],
};

/**
 * Role hierarchy levels for backward-compatible isRoleAtLeast checks.
 */
const ROLE_LEVEL: Record<UserRole, number> = {
  viewer: 1,
  engineer: 2,
  reviewer: 3,
  supervisor: 4,
  admin: 5,
  classification_officer: 3,
  records_manager: 3,
  legal_hold_officer: 3,
  auditor: 3,
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSION_MATRIX[permission];
  return allowedRoles.includes(role);
}

/**
 * Require that the user in ctx has the specified permission.
 * Throws a FORBIDDEN TRPCError if not permitted.
 */
export function requirePermission(
  ctx: { session: { user?: { role?: string } | null } | null },
  permission: Permission,
): void {
  const role = ctx.session?.user?.role as UserRole | undefined;
  if (!role || !hasPermission(role, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing required permission: ${permission}`,
    });
  }
}

/**
 * Check if roleA meets or exceeds the level of roleB.
 * Kept for backward compatibility with existing middleware and router checks.
 */
export function isRoleAtLeast(role: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return (Object.entries(PERMISSION_MATRIX) as [Permission, readonly UserRole[]][])
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([perm]) => perm);
}
