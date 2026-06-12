-- Cabinets system
CREATE TABLE IF NOT EXISTS "cabinets" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text,
  "parent_id" text,
  "color" varchar(7),
  "icon" varchar(32),
  "created_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_cabinets_workspace_parent_name" UNIQUE("workspace_id", "parent_id", "name")
);

CREATE INDEX IF NOT EXISTS "idx_cabinets_workspace_id" ON "cabinets" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_cabinets_parent_id" ON "cabinets" ("parent_id");

CREATE TABLE IF NOT EXISTS "document_cabinets" (
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "cabinet_id" text NOT NULL REFERENCES "cabinets"("id"),
  "added_by" text,
  "added_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "document_cabinets_pkey" PRIMARY KEY("document_id", "cabinet_id")
);

-- Tags system
CREATE TABLE IF NOT EXISTS "tags" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "name" varchar(64) NOT NULL,
  "color" varchar(7) NOT NULL DEFAULT '#6366F1',
  "description" text,
  "created_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "uq_tags_workspace_name" UNIQUE("workspace_id", "name")
);

CREATE INDEX IF NOT EXISTS "idx_tags_workspace_id" ON "tags" ("workspace_id");

CREATE TABLE IF NOT EXISTS "document_tags" (
  "document_id" text NOT NULL REFERENCES "documents"("id"),
  "tag_id" text NOT NULL REFERENCES "tags"("id"),
  "tagged_by" text,
  "tagged_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "document_tags_pkey" PRIMARY KEY("document_id", "tag_id")
);
