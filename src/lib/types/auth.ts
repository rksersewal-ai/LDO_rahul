export type UserRole = "admin" | "supervisor" | "reviewer" | "engineer" | "viewer";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  workspaceId: string | null;
  clearanceLevel: string | null;
  forcePasswordChange: boolean;
}
