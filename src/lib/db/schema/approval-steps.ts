import { index, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const approvalStepStatusEnum = pgEnum("approval_step_status", [
  "pending",
  "approved",
  "rejected",
  "skipped",
]);

export const approvalSteps = pgTable(
  "approval_steps",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id").notNull(),
    stepOrder: integer("step_order").notNull(),
    assignedTo: text("assigned_to"),
    roleRequired: varchar("role_required", { length: 64 }).notNull(),
    status: approvalStepStatusEnum("status").notNull().default("pending"),
    decision: text("decision"),
    comments: text("comments"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_approval_steps_request_id").on(table.requestId),
    index("idx_approval_steps_status").on(table.status),
  ],
);
