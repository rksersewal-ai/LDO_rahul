import { router } from "@/server/trpc";
import { authRouter } from "./auth";
import { documentsRouter } from "./documents";
import { plRouter } from "./pl";
import { workRouter } from "./work";

export const appRouter = router({
  auth: authRouter,
  documents: documentsRouter,
  pl: plRouter,
  work: workRouter,
});

export type AppRouter = typeof appRouter;
