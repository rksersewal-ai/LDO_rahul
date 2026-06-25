# Codebase Audit Report

Generated after running the Graphify task map (`scripts/update-graphify.ts`) and reviewing the PL hub, document preview, routing, CI/CD, DB, and LAN deployment paths.

## Graphify architecture summary

Graphify reports all 46 tracked features as complete. The dependency chain shows the application is organized around these major domains:

- App Router pages under `src/app`, split into protected feature hubs and public/share routes.
- tRPC routers under `src/server/routers` for PL, documents, OCR, BOM, work records, admin, settings, and collaboration flows.
- Shared infrastructure under `src/lib` for auth, DB access, storage, OCR, logging, validation, cache, and security utilities.
- Worker queues under `src/workers` for OCR, deduplication, and retention scans.
- Drizzle migrations under `drizzle` as the PostgreSQL schema source.

## Bugs fixed in this change

1. **PL edit flow was not reachable.** The PL detail page had no working edit route/action even though the router supported `pl.update`. A dedicated `/pl/[id]/edit` page now loads current values, validates changes, calls `trpc.pl.update`, and returns users to the PL detail page.
2. **PL document link lists were action-poor.** Linked PL documents only had an unlink action. The list now includes preview and open actions.
3. **Full PL document association page had a dummy “coming soon” link button.** It now scrolls to the working document search/link panel.
4. **Document preview embedded NAS file paths directly.** Preview now uses the authenticated `/api/documents/[id]/download` route so inline PDF/image rendering uses existing access checks and storage fallback behavior.
5. **Preview OCR reindex was simulated.** The reindex action now calls `trpc.ocr.retrigger` instead of using a fake timeout.
6. **Cross-workspace document linking risk.** `pl.linkDocument`, `pl.getDocuments`, and `pl.getLinkedDocs` now verify document workspace and exclude deleted documents.

## LAN-only security findings and recommendations

- Keep strict workspace isolation on every join between PL and documents. This change strengthens PL-document linking, but other routers should be periodically reviewed for joins missing `workspaceId` filters.
- LAN-only does not mean trusted users. Keep auth, role checks, audit logging, and clearance checks enabled for all document download/preview flows.
- Redis-backed caches and SSE registries should be preferred over in-memory registries if the LAN deployment runs multiple app instances.
- Use reverse-proxy TLS even on LAN where possible; HSTS and secure cookies are already suitable when HTTPS is provided.
- Back up PostgreSQL and the NAS storage volume together. Document rows without matching file bytes are a major operational risk.

## Architectural weaknesses / incomplete areas

- Some dashboard table controls still show “coming soon” placeholders for filter/column visibility. These should be connected to the existing table filter and column visibility patterns instead of remaining informational placeholders.
- Search analytics is feature-gated and currently displays a disabled-state message. That is acceptable if intentional, but should be backed by a feature flag visible in Admin Settings.
- Help-center topic fallbacks still render “Content coming soon” for missing topic content. Add a default operational help article or hide topics without content.
- The document detail edit button routes to `?edit=true`, but the page does not yet render an inline metadata edit mode. Connect it to `DocumentMetadataForm` or route to a dedicated edit page.
- OCR/dedup workers require Redis; production LAN runbooks should include queue dashboards or at least `/api/health` plus worker process monitoring.

## Production-readiness suggestions

- Add Playwright smoke tests for critical LAN flows: login, PL edit, link document to PL, preview document, unlink document, and OCR reindex queueing.
- Add optimistic concurrency for PL edits using `updatedAt` or a `version` column to avoid silent overwrites when many users edit the same PL.
- Add database indexes for frequent PL-document lookups by `(pl_number_id, linked_at)` and document workspace/deleted filters if query plans show sequential scans at scale.
- Replace remaining toast-only operations with persistent audit/activity entries where business-critical actions occur.
