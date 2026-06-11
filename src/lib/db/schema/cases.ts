import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const caseStatusEnum = pgEnum("case_status", [
  "open",
  "investigating",
  "resolved",
  "closed",
]);

export const casePriorityEnum = pgEnum("case_priority", ["low", "medium", "high", "critical"]);

export const cases = pgTable(
  "cases",
  {
    id: text("id").primaryKey(),
    caseNumber: varchar("case_number", { length: 32 }).notNull().unique(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    status: caseStatusEnum("case_status").notNull().default("open"),
    priority: casePriorityEnum("case_priority").notNull().default("medium"),
    category: varchar("category", { length: 128 }),
    assignedTo: text("assigned_to"),
    relatedPlId: text("related_pl_id"),
    relatedDocumentId: text("related_document_id"),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_cases_case_number").on(table.caseNumber),
    index("idx_cases_status").on(table.status),
    index("idx_cases_priority").on(table.priority),
    index("idx_cases_assigned_to").on(table.assignedTo),
    index("idx_cases_related_pl_id").on(table.relatedPlId),
  ],
);
