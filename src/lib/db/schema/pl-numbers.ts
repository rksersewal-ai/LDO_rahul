import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const plCategoryEnum = pgEnum("pl_category", ["CAT-A", "CAT-B", "CAT-C", "CAT-D"]);

export const plStatusEnum = pgEnum("pl_status", [
  "active",
  "inactive",
  "deprecated",
  "under_review",
  "obsolete",
]);

export const plLifecycleStageEnum = pgEnum("pl_lifecycle_stage", [
  "draft",
  "active",
  "restricted",
  "obsolete",
  "deprecated",
]);

export const plAliasTypeEnum = pgEnum("pl_alias_type", [
  "legacy",
  "vendor",
  "drawing",
  "local_name",
]);

export const plRelationTypeEnum = pgEnum("pl_relation_type", [
  "equivalent_to",
  "substitute_for",
  "supersedes",
  "child_of",
  "accessory_of",
  "related_to",
]);

export const plItemTypeEnum = pgEnum("pl_item_type", ["VD", "NVD"]);

export const inspectionAgencyEnum = pgEnum("inspection_agency", [
  "RDSO",
  "ZONAL",
  "WORKSHOP",
  "STORES",
]);

export const plNumbers = pgTable(
  "pl_numbers",
  {
    id: text("id").primaryKey(),
    plNumber: varchar("pl_number", { length: 8 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: plCategoryEnum("category").notNull(),
    status: plStatusEnum("status").notNull().default("active"),
    safetyCritical: boolean("safety_critical").notNull().default(false),
    drawingRef: varchar("drawing_ref", { length: 64 }),
    specification: varchar("specification", { length: 128 }),
    unit: varchar("unit", { length: 32 }),
    workshop: varchar("workshop", { length: 128 }),
    searchVector: text("search_vector"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    vendorCode: varchar("vendor_code", { length: 128 }),
    partFamily: varchar("part_family", { length: 128 }),
    lifecycleStage: plLifecycleStageEnum("lifecycle_stage").default("active"),
    // Railway-specific fields
    itemType: plItemTypeEnum("item_type"),
    uvamItemId: varchar("uvam_item_id", { length: 64 }),
    eligibilityCriteriaText: text("eligibility_criteria_text"),
    eligibilityCriteriaDocId: text("eligibility_criteria_doc_id").references(() => documents.id),
    strDocId: text("str_doc_id").references(() => documents.id),
    qapDocId: text("qap_doc_id").references(() => documents.id),
    inspectionAgency: inspectionAgencyEnum("inspection_agency"),
    unitOfMeasurement: varchar("unit_of_measurement", { length: 16 }),
    shelfLifeMonths: integer("shelf_life_months"),
    lastProcurementRate: real("last_procurement_rate"),
    lastProcurementDate: timestamp("last_procurement_date", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    metadataJson: text("metadata_json"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    workspaceId: text("workspace_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_pl_numbers_workspace_pl").on(table.workspaceId, table.plNumber),
    index("idx_pl_numbers_pl_number").on(table.plNumber),
    index("idx_pl_numbers_category").on(table.category),
    index("idx_pl_numbers_status").on(table.status),
    index("idx_pl_numbers_safety_critical").on(table.safetyCritical),
  ],
);

export const plAliases = pgTable(
  "pl_aliases",
  {
    id: text("id").primaryKey(),
    plId: text("pl_id")
      .notNull()
      .references(() => plNumbers.id),
    workspaceId: text("workspace_id"),
    alias: varchar("alias", { length: 128 }).notNull(),
    aliasType: plAliasTypeEnum("alias_type").notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_pl_aliases_workspace_alias").on(table.workspaceId, table.alias),
    index("idx_pl_aliases_pl_id").on(table.plId),
  ],
);

export const plRelationships = pgTable(
  "pl_relationships",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id"),
    sourcePlId: text("source_pl_id")
      .notNull()
      .references(() => plNumbers.id),
    targetPlId: text("target_pl_id")
      .notNull()
      .references(() => plNumbers.id),
    relationType: plRelationTypeEnum("relation_type").notNull(),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_pl_relationships_source_target_type").on(
      table.sourcePlId,
      table.targetPlId,
      table.relationType,
    ),
    index("idx_pl_relationships_source").on(table.sourcePlId),
    index("idx_pl_relationships_target").on(table.targetPlId),
  ],
);
