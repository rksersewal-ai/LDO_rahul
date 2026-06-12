CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'returned');--> statement-breakpoint
CREATE TYPE "public"."case_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('open', 'investigating', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('DRAWING', 'SPECIFICATION', 'ELIGIBILITY_CRITERIA', 'INSPECTION_REPORT', 'TEST_CERTIFICATE', 'MATERIAL_CERTIFICATE', 'PROCEDURE', 'WORK_ORDER', 'CORRESPONDENCE', 'MANUAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending_review', 'under_review', 'approved', 'rejected', 'superseded', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ocr_status" AS ENUM('not_required', 'queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('approval_request', 'approval_decision', 'document_upload', 'document_comment', 'case_assigned', 'case_update', 'system');--> statement-breakpoint
CREATE TYPE "public"."ocr_job_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pl_category" AS ENUM('CAT-A', 'CAT-B', 'CAT-C', 'CAT-D');--> statement-breakpoint
CREATE TYPE "public"."pl_status" AS ENUM('active', 'inactive', 'deprecated', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'supervisor', 'reviewer', 'engineer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."disposal_type" AS ENUM('repair', 'replace', 'condemn', 'return_to_service', 'further_investigation');--> statement-breakpoint
CREATE TYPE "public"."work_record_status" AS ENUM('open', 'in_progress', 'completed', 'on_hold', 'cancelled');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"requested_by" text NOT NULL,
	"assigned_to" text NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"level" varchar(32) DEFAULT 'reviewer' NOT NULL,
	"comments" text,
	"decided_at" timestamp with time zone,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" varchar(255),
	"details" text,
	"previous_state" text,
	"new_state" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"hash_chain" varchar(64),
	"previous_hash" varchar(64),
	"workspace_id" text,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"bom_product_id" text NOT NULL,
	"item_number" integer NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"part_number" varchar(64),
	"pl_number_id" text,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit" varchar(32) DEFAULT 'nos',
	"material" varchar(255),
	"specification" varchar(255),
	"drawing_ref" varchar(64),
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom_products" (
	"id" text PRIMARY KEY NOT NULL,
	"product_code" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(16) DEFAULT '1.0' NOT NULL,
	"pl_number_id" text,
	"created_by" text,
	"updated_by" text,
	"workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bom_products_product_code_unique" UNIQUE("product_code")
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"case_number" varchar(32) NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"case_status" "case_status" DEFAULT 'open' NOT NULL,
	"case_priority" "case_priority" DEFAULT 'medium' NOT NULL,
	"category" varchar(128),
	"assigned_to" text,
	"related_pl_id" text,
	"related_document_id" text,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "document_pl_links" (
	"document_id" text NOT NULL,
	"pl_number_id" text NOT NULL,
	"linked_by" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "document_pl_links_document_id_pl_number_id_pk" PRIMARY KEY("document_id","pl_number_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"document_number" varchar(64) NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"category" "document_category" NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"revision" varchar(16) DEFAULT 'A' NOT NULL,
	"revision_date" timestamp with time zone,
	"file_hash" varchar(64),
	"three_point_hash" varchar(64),
	"file_path" text,
	"file_size" integer,
	"mime_type" varchar(128),
	"original_filename" varchar(512),
	"ocr_status" "ocr_status" DEFAULT 'not_required' NOT NULL,
	"ocr_confidence" real,
	"ocr_text" text,
	"page_count" integer,
	"thumbnail_path" text,
	"workshop" varchar(128),
	"section" varchar(128),
	"tags" text,
	"metadata" text,
	"is_deleted" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" text,
	"updated_by" text,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(64),
	"entity_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"action_url" text,
	"workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ocr_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"ocr_job_status" "ocr_job_status" DEFAULT 'queued' NOT NULL,
	"engine" varchar(64) DEFAULT 'tesseract',
	"language" varchar(16) DEFAULT 'eng',
	"confidence" real,
	"page_count" integer,
	"processed_pages" integer DEFAULT 0,
	"extracted_text" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(32) NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pl_numbers" (
	"id" text PRIMARY KEY NOT NULL,
	"pl_number" varchar(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "pl_category" NOT NULL,
	"status" "pl_status" DEFAULT 'active' NOT NULL,
	"safety_critical" boolean DEFAULT false NOT NULL,
	"drawing_ref" varchar(64),
	"specification" varchar(128),
	"unit" varchar(32),
	"workshop" varchar(128),
	"search_vector" text,
	"created_by" text,
	"updated_by" text,
	"workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pl_numbers_pl_number_unique" UNIQUE("pl_number")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" varchar(512),
	"category" varchar(64) DEFAULT 'general' NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_workspaces" (
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" "user_role" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text,
	CONSTRAINT "user_workspaces_user_id_workspace_id_pk" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"designation" varchar(128) NOT NULL,
	"department" varchar(128) NOT NULL,
	"section" varchar(128) NOT NULL,
	"employee_id" varchar(32) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"lock_reason" text,
	"force_password_change" boolean DEFAULT true NOT NULL,
	"password_changed_at" timestamp with time zone,
	"clearance_level" varchar(16),
	"workspace_id" text,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "work_records" (
	"id" text PRIMARY KEY NOT NULL,
	"work_order_number" varchar(64) NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"pl_number_id" text,
	"status" "work_record_status" DEFAULT 'open' NOT NULL,
	"priority" varchar(16) DEFAULT 'medium' NOT NULL,
	"disposal_type" "disposal_type",
	"disposal_notes" text,
	"disposal_date" timestamp with time zone,
	"disposed_by" text,
	"quantity" integer DEFAULT 1,
	"loco_number" varchar(32),
	"workshop" varchar(128),
	"section" varchar(128),
	"assigned_to" text,
	"completed_at" timestamp with time zone,
	"due_date" timestamp with time zone,
	"created_by" text,
	"updated_by" text,
	"workspace_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_records_work_order_number_unique" UNIQUE("work_order_number")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(32) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"storage_quota_gb" integer DEFAULT 100 NOT NULL,
	"used_storage_bytes" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_entries" ADD CONSTRAINT "bom_entries_bom_product_id_bom_products_id_fk" FOREIGN KEY ("bom_product_id") REFERENCES "public"."bom_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_entries" ADD CONSTRAINT "bom_entries_pl_number_id_pl_numbers_id_fk" FOREIGN KEY ("pl_number_id") REFERENCES "public"."pl_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_products" ADD CONSTRAINT "bom_products_pl_number_id_pl_numbers_id_fk" FOREIGN KEY ("pl_number_id") REFERENCES "public"."pl_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_pl_links" ADD CONSTRAINT "document_pl_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_pl_links" ADD CONSTRAINT "document_pl_links_pl_number_id_pl_numbers_id_fk" FOREIGN KEY ("pl_number_id") REFERENCES "public"."pl_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workspaces" ADD CONSTRAINT "user_workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_workspaces" ADD CONSTRAINT "user_workspaces_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_pl_number_id_pl_numbers_id_fk" FOREIGN KEY ("pl_number_id") REFERENCES "public"."pl_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approvals_document_id" ON "approvals" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_approvals_assigned_to" ON "approvals" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_approvals_status" ON "approvals" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "idx_audit_log_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_id" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_created_at" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_bom_entries_bom_product_id" ON "bom_entries" USING btree ("bom_product_id");--> statement-breakpoint
CREATE INDEX "idx_bom_entries_pl_number_id" ON "bom_entries" USING btree ("pl_number_id");--> statement-breakpoint
CREATE INDEX "idx_bom_entries_part_number" ON "bom_entries" USING btree ("part_number");--> statement-breakpoint
CREATE INDEX "idx_bom_products_product_code" ON "bom_products" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "idx_bom_products_pl_number_id" ON "bom_products" USING btree ("pl_number_id");--> statement-breakpoint
CREATE INDEX "idx_cases_case_number" ON "cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "idx_cases_status" ON "cases" USING btree ("case_status");--> statement-breakpoint
CREATE INDEX "idx_cases_priority" ON "cases" USING btree ("case_priority");--> statement-breakpoint
CREATE INDEX "idx_cases_assigned_to" ON "cases" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_cases_related_pl_id" ON "cases" USING btree ("related_pl_id");--> statement-breakpoint
CREATE INDEX "idx_doc_pl_links_document_id" ON "document_pl_links" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_pl_links_pl_number_id" ON "document_pl_links" USING btree ("pl_number_id");--> statement-breakpoint
CREATE INDEX "idx_documents_document_number" ON "documents" USING btree ("document_number");--> statement-breakpoint
CREATE INDEX "idx_documents_category" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_documents_file_hash" ON "documents" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_documents_three_point_hash" ON "documents" USING btree ("three_point_hash");--> statement-breakpoint
CREATE INDEX "idx_documents_created_at" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_documents_ocr_status" ON "documents" USING btree ("ocr_status");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ocr_jobs_document_id" ON "ocr_jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_ocr_jobs_status" ON "ocr_jobs" USING btree ("ocr_job_status");--> statement-breakpoint
CREATE INDEX "idx_pl_numbers_pl_number" ON "pl_numbers" USING btree ("pl_number");--> statement-breakpoint
CREATE INDEX "idx_pl_numbers_category" ON "pl_numbers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_pl_numbers_status" ON "pl_numbers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pl_numbers_safety_critical" ON "pl_numbers" USING btree ("safety_critical");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_department" ON "users" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_users_employee_id" ON "users" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_work_records_work_order_number" ON "work_records" USING btree ("work_order_number");--> statement-breakpoint
CREATE INDEX "idx_work_records_pl_number_id" ON "work_records" USING btree ("pl_number_id");--> statement-breakpoint
CREATE INDEX "idx_work_records_status" ON "work_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_work_records_loco_number" ON "work_records" USING btree ("loco_number");--> statement-breakpoint
CREATE INDEX "idx_work_records_created_at" ON "work_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_workspaces_org_id" ON "workspaces" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_code" ON "workspaces" USING btree ("code");