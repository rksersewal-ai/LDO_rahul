import { boolean, index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const approvalEntityTypeEnum = pgEnum("approval_entity_type", [
  "document",
  "bom",
  "governance",
]);

export const approvalChainTemplates = pgTable(
  "approval_chain_templates",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    entityType: approvalEntityTypeEnum("entity_type").notNull(),
    steps: text("steps").notNull(), // JSON string of [{order, roleRequired, daysToEscalate}]
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_approval_chain_templates_workspace_entity").on(table.workspaceId, table.entityType),
  ],
);
