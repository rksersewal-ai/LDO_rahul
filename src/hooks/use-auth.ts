"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/mock-data/users";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user ?? null;
  const role = (user?.role as UserRole) ?? null;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  function checkPermission(action: Permission): boolean {
    if (!role) return false;
    return hasPermission(role, action);
  }

  return {
    session,
    user,
    role,
    isAuthenticated,
    isLoading,
    hasPermission: checkPermission,
  };
}
