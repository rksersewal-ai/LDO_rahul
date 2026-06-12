import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: text("entity_id").notNull(),
    userId: text("user_id").notNull(),
    userName: varchar("user_name", { length: 255 }),
    details: text("details"),
    previousState: text("previous_state"),
    newState: text("new_state"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    hashChain: varchar("hash_chain", { length: 64 }),
    previousHash: varchar("previous_hash", { length: 64 }),
    workspaceId: text("workspace_id"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_log_entity").on(table.entityType, table.entityId),
    index("idx_audit_log_user_id").on(table.userId),
    index("idx_audit_log_action").on(table.action),
    index("idx_audit_log_created_at").on(table.createdAt),
  ],
);
