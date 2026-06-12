import { boolean, index, pgEnum, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const settingsScopeEnum = pgEnum("settings_scope", [
  "system",
  "organization",
  "workspace",
  "user",
]);

export const settingsDataTypeEnum = pgEnum("settings_data_type", [
  "string",
  "number",
  "boolean",
  "json",
]);

export const settings = pgTable(
  "settings",
  {
    id: text("id").primaryKey(),
    scope: settingsScopeEnum("scope").notNull(),
    scopeId: text("scope_id"),
    key: varchar("key", { length: 128 }).notNull(),
    value: text("value").notNull(),
    dataType: settingsDataTypeEnum("data_type").notNull().default("string"),
    description: varchar("description", { length: 512 }),
    isPublic: boolean("is_public").notNull().default(false),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_settings_scope_key").on(table.scope, table.scopeId, table.key),
    index("idx_settings_scope_scope_id").on(table.scope, table.scopeId),
  ],
);
