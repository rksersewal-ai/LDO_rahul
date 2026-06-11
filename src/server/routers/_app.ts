import { router } from "@/server/trpc";
import { authRouter } from "./auth";

export const appRouter = router({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
