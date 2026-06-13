import { router } from "@/server/trpc";
import { adminRouter } from "./admin";
import { approvalsRouter } from "./approvals";
import { authRouter } from "./auth";
import { bomRouter } from "./bom";
import { cabinetsRouter } from "./cabinets";
import { casesRouter } from "./cases";
import { dashboardRouter } from "./dashboard";
import { dedupRouter } from "./dedup";
import { documentCommentsRouter } from "./document-comments";
import { documentShareLinksRouter } from "./document-share-links";
import { documentVersionsRouter } from "./document-versions";
import { documentsRouter } from "./documents";
import { governanceRouter } from "./governance";
import { notificationsRouter } from "./notifications";
import { ocrRouter } from "./ocr";
import { plRouter } from "./pl";
import { rollingStockRouter } from "./rolling-stock";
import { searchRouter } from "./search";
import { settingsRouter } from "./settings";
import { tagsRouter } from "./tags";
import { workRouter } from "./work";
import { workspacesRouter } from "./workspaces";

export const appRouter = router({
  admin: adminRouter,
  approvals: approvalsRouter,
  auth: authRouter,
  bom: bomRouter,
  cabinets: cabinetsRouter,
  cases: casesRouter,
  dashboard: dashboardRouter,
  dedup: dedupRouter,
  documentComments: documentCommentsRouter,
  documentShareLinks: documentShareLinksRouter,
  documentVersions: documentVersionsRouter,
  documents: documentsRouter,
  governance: governanceRouter,
  notifications: notificationsRouter,
  ocr: ocrRouter,
  pl: plRouter,
  rollingStock: rollingStockRouter,
  search: searchRouter,
  settings: settingsRouter,
  tags: tagsRouter,
  work: workRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;
