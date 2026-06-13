import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { bomProducts } from "./bom";

export const rollingStockStatusEnum = pgEnum("rolling_stock_status", [
  "active",
  "under_overhaul",
  "condemned",
  "transferred",
  "awaiting_commissioning",
]);

export const rollingStockUnits = pgTable(
  "rolling_stock_units",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    productId: text("product_id").references(() => bomProducts.id),
    unitNumber: varchar("unit_number", { length: 64 }).notNull().unique(),
    serialNumber: varchar("serial_number", { length: 64 }),
    manufacturedDate: timestamp("manufactured_date", { withTimezone: true }),
    commissioningDate: timestamp("commissioning_date", { withTimezone: true }),
    status: rollingStockStatusEnum("status").notNull().default("active"),
    homeWorkshop: varchar("home_workshop", { length: 128 }).notNull(),
    currentLocation: varchar("current_location", { length: 128 }),
    notes: text("notes"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_rolling_stock_units_workspace_id").on(table.workspaceId),
    index("idx_rolling_stock_units_product_id").on(table.productId),
    index("idx_rolling_stock_units_unit_number").on(table.unitNumber),
    index("idx_rolling_stock_units_status").on(table.status),
    index("idx_rolling_stock_units_home_workshop").on(table.homeWorkshop),
  ],
);
