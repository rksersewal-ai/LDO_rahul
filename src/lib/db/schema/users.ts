import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "supervisor",
  "reviewer",
  "engineer",
  "viewer",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: varchar("username", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    designation: varchar("designation", { length: 128 }).notNull(),
    department: varchar("department", { length: 128 }).notNull(),
    section: varchar("section", { length: 128 }).notNull(),
    employeeId: varchar("employee_id", { length: 32 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").notNull().default("viewer"),
    isActive: boolean("is_active").notNull().default(true),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_users_role").on(table.role),
    index("idx_users_department").on(table.department),
    index("idx_users_employee_id").on(table.employeeId),
  ],
);
