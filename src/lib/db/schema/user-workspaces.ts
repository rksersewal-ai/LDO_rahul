import { boolean, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum, users } from "./users";
import { workspaces } from "./workspaces";

export const userWorkspaces = pgTable(
  "user_workspaces",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    role: userRoleEnum("role").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    assignedBy: text("assigned_by"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.workspaceId] })],
);
