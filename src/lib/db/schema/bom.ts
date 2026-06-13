import { boolean, index, integer, pgEnum, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { plNumbers } from "./pl-numbers";

export const bomProductTypeEnum = pgEnum("bom_product_type", [
  "locomotive",
  "coach",
  "emu",
  "assembly",
  "sub_assembly",
  "component",
]);

export const bomGaugeEnum = pgEnum("bom_gauge", [
  "broad_gauge",
  "metre_gauge",
  "narrow_gauge",
]);

export const bomProducts = pgTable(
  "bom_products",
  {
    id: text("id").primaryKey(),
    productCode: varchar("product_code", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    version: varchar("version", { length: 16 }).notNull().default("1.0"),
    plNumberId: text("pl_number_id").references(() => plNumbers.id),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    workspaceId: text("workspace_id"),
    approvalStatus: varchar("approval_status", { length: 16 }).notNull().default("draft"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    cloneSourceId: text("clone_source_id"),
    productType: bomProductTypeEnum("product_type"),
    baseProductId: text("base_product_id"),
    variantNotes: text("variant_notes"),
    gauge: bomGaugeEnum("gauge"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bom_products_product_code").on(table.productCode),
    index("idx_bom_products_pl_number_id").on(table.plNumberId),
  ],
);

export const bomEntries = pgTable(
  "bom_entries",
  {
    id: text("id").primaryKey(),
    bomProductId: text("bom_product_id")
      .notNull()
      .references(() => bomProducts.id),
    itemNumber: integer("item_number").notNull(),
    partName: varchar("part_name", { length: 255 }).notNull(),
    partNumber: varchar("part_number", { length: 64 }),
    plNumberId: text("pl_number_id").references(() => plNumbers.id),
    quantity: real("quantity").notNull().default(1),
    unit: varchar("unit", { length: 32 }).default("nos"),
    material: varchar("material", { length: 255 }),
    specification: varchar("specification", { length: 255 }),
    drawingRef: varchar("drawing_ref", { length: 64 }),
    remarks: text("remarks"),
    parentId: text("parent_id"),
    position: integer("position").notNull().default(0),
    type: varchar("type", { length: 32 }),
    effectivityDate: timestamp("effectivity_date", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bom_entries_bom_product_id").on(table.bomProductId),
    index("idx_bom_entries_pl_number_id").on(table.plNumberId),
    index("idx_bom_entries_part_number").on(table.partNumber),
  ],
);
