import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const cabinets = pgTable(
  "cabinets",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    color: varchar("color", { length: 7 }),
    icon: varchar("icon", { length: 32 }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_cabinets_workspace_parent_name").on(table.workspaceId, table.parentId, table.name),
    index("idx_cabinets_workspace_id").on(table.workspaceId),
    index("idx_cabinets_parent_id").on(table.parentId),
    foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }),
  ],
);

export const documentCabinets = pgTable(
  "document_cabinets",
  {
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    cabinetId: text("cabinet_id")
      .notNull()
      .references(() => cabinets.id),
    addedBy: text("added_by"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.documentId, table.cabinetId] })],
);
