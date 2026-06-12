import { index, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { plNumbers } from "./pl-numbers";

export const workRecordStatusEnum = pgEnum("work_record_status", [
  "open",
  "in_progress",
  "completed",
  "on_hold",
  "cancelled",
]);

export const disposalTypeEnum = pgEnum("disposal_type", [
  "repair",
  "replace",
  "condemn",
  "return_to_service",
  "further_investigation",
]);

export const workRecords = pgTable(
  "work_records",
  {
    id: text("id").primaryKey(),
    workOrderNumber: varchar("work_order_number", { length: 64 }).notNull().unique(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    plNumberId: text("pl_number_id").references(() => plNumbers.id),
    status: workRecordStatusEnum("status").notNull().default("open"),
    priority: varchar("priority", { length: 16 }).notNull().default("medium"),
    disposalType: disposalTypeEnum("disposal_type"),
    disposalNotes: text("disposal_notes"),
    disposalDate: timestamp("disposal_date", { withTimezone: true }),
    disposedBy: text("disposed_by"),
    quantity: integer("quantity").default(1),
    locoNumber: varchar("loco_number", { length: 32 }),
    workshop: varchar("workshop", { length: 128 }),
    section: varchar("section", { length: 128 }),
    assignedTo: text("assigned_to"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    workspaceId: text("workspace_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_work_records_work_order_number").on(table.workOrderNumber),
    index("idx_work_records_pl_number_id").on(table.plNumberId),
    index("idx_work_records_status").on(table.status),
    index("idx_work_records_loco_number").on(table.locoNumber),
    index("idx_work_records_created_at").on(table.createdAt),
  ],
);
