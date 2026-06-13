import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // Allow public paths
  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
  const isTrpcApi = nextUrl.pathname.startsWith("/api/trpc");
  const isChangePasswordPage = nextUrl.pathname === "/change-password";

  if (isLoginPage || isAuthApi) {
    // Redirect authenticated users away from login
    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Allow tRPC calls (they handle their own auth via context)
  if (isTrpcApi) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Force password change redirect
  const forcePasswordChange = (req.auth?.user as Record<string, unknown>)?.forcePasswordChange;
  if (forcePasswordChange && !isChangePasswordPage) {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
