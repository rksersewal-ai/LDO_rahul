import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy (renamed from middleware.ts).
 *
 * Uses a lightweight cookie-presence check instead of calling auth() on every
 * request — the full JWT verification happens in the RSC layer via auth().
 * This keeps the proxy fast and prevents static-asset requests from being
 * redirected to login.
 *
 * The `config.matcher` below excludes _next/static, _next/image, and all
 * common static file extensions so they are always served without running
 * this proxy function.
 */

const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";

function isSafeRedirect(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("://");
}

export default function proxy(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // Lightweight session check — presence only; NextAuth verifies the signature
  // in RSC layouts via auth().
  const isAuthenticated = !!cookies.get(SESSION_COOKIE)?.value;

  // Always allow: login page, auth API, health-check, change-password
  const isLoginPage = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isTrpcApi = pathname.startsWith("/api/trpc");
  const isHealthApi = pathname === "/api/health";
  const isSharePage = pathname.startsWith("/share");
  const isChangePasswordPage = pathname === "/change-password";

  // Redirect authenticated users away from /login
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Public paths — always allow
  if (isLoginPage || isAuthApi || isTrpcApi || isHealthApi || isSharePage || isChangePasswordPage) {
    return NextResponse.next();
  }

  // Protect everything else
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl);
    const safePath = isSafeRedirect(pathname) ? pathname : "/";
    loginUrl.searchParams.set("callbackUrl", safePath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (JS/CSS chunks, fonts)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - Static file extensions (svg, png, jpg, woff2, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)",
  ],
};
