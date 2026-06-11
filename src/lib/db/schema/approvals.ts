import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "returned",
]);

export const approvals = pgTable(
  "approvals",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    requestedBy: text("requested_by").notNull(),
    assignedTo: text("assigned_to").notNull(),
    status: approvalStatusEnum("approval_status").notNull().default("pending"),
    level: varchar("level", { length: 32 }).notNull().default("reviewer"),
    comments: text("comments"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_approvals_document_id").on(table.documentId),
    index("idx_approvals_assigned_to").on(table.assignedTo),
    index("idx_approvals_status").on(table.status),
  ],
);
