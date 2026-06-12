import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    department?: string;
    designation?: string;
    workspaceId?: string | null;
    clearanceLevel?: string | null;
    forcePasswordChange?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      designation: string;
      workspaceId: string | null;
      clearanceLevel: string | null;
      forcePasswordChange: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    userId?: string;
    department?: string;
    designation?: string;
    workspaceId?: string | null;
    clearanceLevel?: string | null;
    forcePasswordChange?: boolean;
  }
}
