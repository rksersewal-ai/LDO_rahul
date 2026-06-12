import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const legalHoldStatusEnum = pgEnum("legal_hold_status", [
  "active",
  "released",
]);

export const legalHolds = pgTable(
  "legal_holds",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    caseReference: varchar("case_reference", { length: 128 }),
    status: legalHoldStatusEnum("status").notNull().default("active"),
    placedBy: text("placed_by").notNull(),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    releasedBy: text("released_by"),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    releaseReason: text("release_reason"),
  },
  (table) => [
    index("idx_legal_holds_workspace_id").on(table.workspaceId),
    index("idx_legal_holds_status").on(table.status),
  ],
);
