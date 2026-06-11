import { router } from "@/server/trpc";
import { authRouter } from "./auth";
import { bomRouter } from "./bom";
import { documentsRouter } from "./documents";
import { plRouter } from "./pl";
import { searchRouter } from "./search";
import { workRouter } from "./work";

export const appRouter = router({
  auth: authRouter,
  bom: bomRouter,
  documents: documentsRouter,
  pl: plRouter,
  search: searchRouter,
  work: workRouter,
});

export type AppRouter = typeof appRouter;
