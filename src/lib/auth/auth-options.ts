import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const MAX_FAILED_ATTEMPTS = 5;

// In production the app is served over HTTPS and is frequently embedded in a
// cross-origin iframe (e.g. the v0 preview). Browsers treat cookies inside a
// third-party iframe as cross-site, so the default SameSite=Lax session/CSRF
// cookies are silently dropped — making login appear to "succeed" and then
// immediately bounce back to /login. Using SameSite=None + Secure lets the
// auth cookies flow inside the embedded preview. Locally (HTTP) we must keep
// Lax + non-secure, since SameSite=None requires the Secure attribute.
const useSecureCookies = process.env.NODE_ENV === "production";
const sameSite = useSecureCookies ? "none" : "lax";
const sessionCookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const authConfig: NextAuthConfig = {
  // Trust the host header behind the preview/proxy. Without this, NextAuth v5
  // throws UntrustedHost on any host that isn't localhost or a *.vercel.app
  // deployment URL, which blocks login in the proxied preview.
  trustHost: true,
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite,
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? "__Secure-authjs.callback-url" : "authjs.callback-url",
      options: {
        sameSite,
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      // __Host- prefix requires Secure + Path=/ + no Domain (all satisfied);
      // SameSite=None is permitted and is required so the CSRF cookie is sent
      // on the login POST from within the cross-origin preview iframe.
      name: useSecureCookies ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite,
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;

        // Query user by username or email, must be active
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.username, username), eq(users.email, username)))
            .limit(1);

          if (!user) return null;

          if (!user.isActive) return null;

          // Check if account is locked
          if (user.lockedAt) {
            return null;
          }

          // Verify password with bcrypt
          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            // Increment failed attempts
            const newAttempts = user.failedLoginAttempts + 1;
            const updateData: Record<string, unknown> = {
              failedLoginAttempts: newAttempts,
            };

            // Lock account if threshold reached
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
              updateData.lockedAt = new Date();
              updateData.lockReason = "Account locked due to multiple failed login attempts";
            }

            await db.update(users).set(updateData).where(eq(users.id, user.id));
            return null;
          }

          // Successful login: reset failed attempts, update lastLogin
          await db
            .update(users)
            .set({
              failedLoginAttempts: 0,
              lastLogin: new Date(),
            })
            .where(eq(users.id, user.id));

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            designation: user.designation,
            workspaceId: user.workspaceId,
            clearanceLevel: user.clearanceLevel,
            forcePasswordChange: user.forcePasswordChange,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.role = u.role;
        token.userId = user.id;
        token.department = u.department;
        token.designation = u.designation;
        token.workspaceId = u.workspaceId;
        token.clearanceLevel = u.clearanceLevel;
        token.forcePasswordChange = u.forcePasswordChange;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        session.user.designation = token.designation as string;
        session.user.workspaceId = (token.workspaceId as string) ?? null;
        session.user.clearanceLevel = (token.clearanceLevel as string) ?? null;
        session.user.forcePasswordChange = (token.forcePasswordChange as boolean) ?? false;
      }
      return session;
    },
  },
};
