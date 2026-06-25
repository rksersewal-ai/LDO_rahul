# Production readiness follow-up

## Scope

This follow-up focused on deployability, PostgreSQL readiness, safe logging, health visibility, and practical LAN load testing gates.

## Issues found and fixes made

- **Missing npm-compatible gates:** The repo had Bun-oriented scripts but did not expose every command requested for production validation. Added `format:check`, `test:integration`, and load-test scripts while keeping the existing Bun workflow intact.
- **No dependency-free load-test gate:** Added `scripts/load-test.mjs`, which runs smoke, normal, stress, spike, and soak profiles against configurable LAN endpoints and records throughput, latency percentiles, status counts, error rate, timeouts, process CPU, memory, and event-loop utilization.
- **Health endpoint lacked pool/resource telemetry:** `/api/health` now includes process uptime, memory usage, and PostgreSQL pool counters so SREs can detect pool exhaustion and memory pressure during deployment checks.
- **Structured logs could include secrets or production stacks:** Logging now redacts sensitive context keys and database-style credentials, and stack traces are suppressed in production logs.
- **PL/document association indexes needed scale hardening:** Added composite indexes for PL-document lookups sorted by link time and document-link lookups sorted by link time.
- **CI did not run the new requested gates:** CI now runs format check and a PostgreSQL integration check in addition to env validation, migration validation, lint, typecheck, unit tests, and build.

## Load-test usage

Run a deployed or local production server first, then execute:

```bash
LOAD_TEST_BASE_URL=http://localhost:3000 npm run load:test:smoke
LOAD_TEST_BASE_URL=http://localhost:3000 npm run load:test
LOAD_TEST_BASE_URL=http://localhost:3000 npm run load:test:stress
LOAD_TEST_BASE_URL=http://localhost:3000 npm run load:test:spike
LOAD_TEST_BASE_URL=http://localhost:3000 npm run load:test:soak
```

Reports are written under `load-test-results/`. Defaults fail when error rate exceeds 2% or p95 latency exceeds 1500 ms. Tune thresholds with `LOAD_TEST_MAX_ERROR_RATE` and `LOAD_TEST_P95_MS` for staging baselines.

## PostgreSQL changes

- Added `0011_production_readiness_indexes.sql`.
- Added matching Drizzle schema indexes on `document_pl_links`.
- Added pool telemetry through `getDbPoolStats()`.

## Remaining manual production steps

- Run `npm run db:migrate` against staging and production using the real `DATABASE_URL` before deploying the new app image.
- Run load profiles against staging after migration and before production rollout.
- Review `load-test-results/*.json` for p95/p99 latency, 5xx responses, and timeouts.
- Compare `/api/health` database pool `waitingCount` and PostgreSQL `pg_stat_activity` during stress/spike tests.
- If p95 latency or pool waiting increases at target concurrency, tune PgBouncer / `DB_POOL_MAX` and add query-plan-specific indexes based on `EXPLAIN (ANALYZE, BUFFERS)`.

## Local load-test results

These tests were run against `next start` on `http://localhost:3100` with unauthenticated LAN-safe routes (`/login`, `/documents`, `/pl`, `/search`). Protected routes returned expected redirects. A real staging run should include authenticated journeys and a live PostgreSQL database.

| Profile | Duration | Concurrency | Requests | Throughput | Error rate | p95 | p99 | Max | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| smoke | 10s | 2 | 6,786 | 678.53 rps | 0% | 6 ms | 14 ms | 223 ms | Passed |
| normal | 30s | 10 | 31,732 | 1,057.49 rps | 0% | 17 ms | 25 ms | 134 ms | Passed |
| stress | 45s | 30 | 50,781 | 1,127.94 rps | 0% | 43 ms | 53 ms | 175 ms | Passed |
| spike | 20s | 75 | 20,744 | 1,033.99 rps | 0% | 114 ms | 158 ms | 1,270 ms | Passed |

A long soak test was not run in this ephemeral environment because it requires a stable long-lived app server and production-like database/Redis/NAS services. The `load:test:soak` script is provided for staging.

## Supabase environment follow-up

- Added support for Supabase-style variable names without committing secret values: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, and public `NEXT_PUBLIC_SUPABASE_*` aliases.
- Drizzle migrations now prefer `POSTGRES_URL_NON_POOLING` when available, which is safer for schema migrations than a transaction-pooling PgBouncer URL.
- The supplied Supabase values validated successfully with `npm run validate:env` when loaded from a temporary local env file. They were not committed.
- `npm run db:migrate` was attempted with the supplied Supabase URLs, but the environment could not resolve the Supabase host (`EAI_AGAIN`). Retry migration from a network that can resolve and reach the Supabase project, then rotate the credentials because they were shared in chat.
