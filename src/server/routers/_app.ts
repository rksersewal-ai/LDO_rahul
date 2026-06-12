import { router } from "@/server/trpc";
import { adminRouter } from "./admin";
import { approvalsRouter } from "./approvals";
import { authRouter } from "./auth";
import { bomRouter } from "./bom";
import { casesRouter } from "./cases";
import { documentsRouter } from "./documents";
import { notificationsRouter } from "./notifications";
import { ocrRouter } from "./ocr";
import { plRouter } from "./pl";
import { searchRouter } from "./search";
import { workRouter } from "./work";
import { workspacesRouter } from "./workspaces";

export const appRouter = router({
  admin: adminRouter,
  approvals: approvalsRouter,
  auth: authRouter,
  bom: bomRouter,
  cases: casesRouter,
  documents: documentsRouter,
  notifications: notificationsRouter,
  ocr: ocrRouter,
  pl: plRouter,
  search: searchRouter,
  work: workRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;
