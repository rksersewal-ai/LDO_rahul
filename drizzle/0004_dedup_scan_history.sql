-- Dedup Scan History table
-- Covers: dedup_scan_history table for background dedup scan feature
-- Tracks scan execution metadata for workspace-level duplicate detection runs

CREATE TABLE IF NOT EXISTS "dedup_scan_history" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "scan_type" varchar(16) NOT NULL,
  "status" varchar(16) NOT NULL,
  "triggered_by" text NOT NULL,
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  "pairs_scored" integer NOT NULL DEFAULT 0,
  "detections_found" integer NOT NULL DEFAULT 0,
  "error_message" text,
  "batch_size" integer NOT NULL
);
