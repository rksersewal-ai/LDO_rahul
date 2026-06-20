import NextAuth from "next-auth";
import { authConfig } from "./auth-options";

// Fail fast in production if the session-signing secret is missing or left at
// the documented example value. A weak/known secret lets an attacker forge
// session tokens. Skipped during the build phase, when secrets aren't present.
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  (!authSecret || authSecret === "change-this-to-a-random-32-byte-string-in-production")
) {
  throw new Error(
    "AUTH_SECRET environment variable is required in production and must not use the example default value.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
