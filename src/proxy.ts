import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  // Wrap with NextAuth to get session (async)
  const session = await auth();

  const { nextUrl } = req;
  const isAuthenticated = !!session;

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

  // Allow health-check endpoint so monitoring tools and load balancers
  // can reach it without a session cookie.
  const isHealthApi = nextUrl.pathname === "/api/health";
  if (isHealthApi) {
    return NextResponse.next();
  }

  function isSafeRedirect(url: string): boolean {
    return url.startsWith("/") && !url.startsWith("//") && !url.includes("://");
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl);
    const safePath = isSafeRedirect(nextUrl.pathname) ? nextUrl.pathname : "/";
    loginUrl.searchParams.set("callbackUrl", safePath);
    return NextResponse.redirect(loginUrl);
  }

  // Force password change redirect
  const forcePasswordChange = session?.user?.forcePasswordChange;
  if (forcePasswordChange && nextUrl.pathname !== "/change-password" && !isAuthApi) {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  return NextResponse.next();
}
