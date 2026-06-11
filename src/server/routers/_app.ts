import { router } from "@/server/trpc";
import { authRouter } from "./auth";
import { documentsRouter } from "./documents";
import { plRouter } from "./pl";

export const appRouter = router({
  auth: authRouter,
  documents: documentsRouter,
  pl: plRouter,
});

export type AppRouter = typeof appRouter;
