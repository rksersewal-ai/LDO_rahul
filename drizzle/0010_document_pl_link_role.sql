-- Document Association Ledger: semantic link role on document_pl_links
--
-- Adds a nullable 'link_role' so PL<->document associations can be grouped by
-- role in the ledger: general | te (technical evaluation) | prototype_approval
-- | correspondence. Nullable so existing links are unaffected (treated as
-- 'general'). Idempotent so it is safe to re-apply / apply via drizzle-kit push.
--
-- The ledger's join/aggregation is served by the existing
-- idx_doc_pl_links_pl_number_id index; link_role is low-cardinality, so no
-- separate index is created (kept consistent with the Drizzle schema).

ALTER TABLE "document_pl_links" ADD COLUMN IF NOT EXISTS "link_role" varchar(32);
