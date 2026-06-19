import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const authConfig: NextAuthConfig = {
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
        const [user] = await db
          .select()
          .from(users)
          .where(or(eq(users.username, username), eq(users.email, username)))
          .limit(1);

        if (!user?.isActive) return null;

        // Check if account is locked
        if (user.lockedAt) {
          const lockElapsed = Date.now() - new Date(user.lockedAt).getTime();
          if (lockElapsed < LOCKOUT_DURATION_MS) {
            // Lockout period has not expired yet
            return null;
          }
          // Lockout period expired: auto-unlock the account
          await db
            .update(users)
            .set({
              lockedAt: null,
              lockReason: null,
              failedLoginAttempts: 0,
            })
            .where(eq(users.id, user.id));
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
