import "server-only";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

/**
 * Server-side tRPC caller for use in Server Components and server actions.
 */
export async function createCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}
