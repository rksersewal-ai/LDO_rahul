import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  description: varchar("description", { length: 512 }),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
