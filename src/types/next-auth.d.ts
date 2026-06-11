import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    department?: string;
    designation?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      designation: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    userId?: string;
    department?: string;
    designation?: string;
  }
}
