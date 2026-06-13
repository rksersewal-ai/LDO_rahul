import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const dedupScanHistory = pgTable("dedup_scan_history", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  scanType: varchar("scan_type", { length: 16 }).notNull(), // 'basic' | 'advanced'
  status: varchar("status", { length: 16 }).notNull(), // 'running' | 'completed' | 'failed' | 'cancelled'
  triggeredBy: text("triggered_by").notNull(), // userId or 'scheduler'
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  pairsScored: integer("pairs_scored").notNull().default(0),
  detectionsFound: integer("detections_found").notNull().default(0),
  errorMessage: text("error_message"),
  batchSize: integer("batch_size").notNull(),
});
