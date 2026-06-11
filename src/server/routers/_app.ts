import { router } from "@/server/trpc";
import { approvalsRouter } from "./approvals";
import { authRouter } from "./auth";
import { bomRouter } from "./bom";
import { casesRouter } from "./cases";
import { documentsRouter } from "./documents";
import { notificationsRouter } from "./notifications";
import { plRouter } from "./pl";
import { searchRouter } from "./search";
import { workRouter } from "./work";

export const appRouter = router({
  approvals: approvalsRouter,
  auth: authRouter,
  bom: bomRouter,
  cases: casesRouter,
  documents: documentsRouter,
  notifications: notificationsRouter,
  pl: plRouter,
  search: searchRouter,
  work: workRouter,
});

export type AppRouter = typeof appRouter;
