# LDO-2 EDMS (Electronic Document Management System)

Railway document intelligence platform built with Next.js, tRPC, Drizzle ORM, PostgreSQL, Redis-backed workers, and document OCR services.

## Project structure

```text
src/app/                 Next.js App Router pages, layouts, route handlers
src/components/          Reusable UI, feature, and layout components
src/hooks/               Client-side feature hooks
src/lib/                 Shared auth, DB, OCR, storage, logging, validation, utilities
src/server/              tRPC routers and server middleware
src/workers/             BullMQ worker entrypoints and queue processors
drizzle/                 Versioned PostgreSQL migrations and Drizzle metadata
scripts/                 Operational scripts for seed, env, and migration checks
docs/deployment/         Deployment, rollback, and operations guide
```

## Prerequisites

- Bun `1.2.14` (see `mise.toml`)
- Node.js `20` for compatible runtime/container deployments
- PostgreSQL `16` locally or managed PostgreSQL for hosted environments
- Redis `7` for queues, cache, notifications, and rate limiting

## Environment setup

1. Copy `.env.example` to `.env.local`.
2. Fill in local values. Do **not** commit real `.env` files.
3. Validate configuration:

```bash
bun run validate:env
```

Required production runtime variables:

- `DATABASE_URL` or `POSTGRES_URL`
- `AUTH_SECRET` or `NEXTAUTH_SECRET` with at least 32 characters
- `NEXT_PUBLIC_APP_URL`
- `STORAGE_NAS_PATH`

Optional integrations:

- `REDIS_URL` for queues/cache/rate limiting
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for email

## Local development

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Install, validate, migrate, seed, and run:

```bash
bun install --frozen-lockfile
bun run validate:env
bun run db:migrate
bun run seed
bun run dev
```

Optional demo data:

```bash
bun run seed:mock
```

## PostgreSQL and migrations

Migrations live in `drizzle/` and are tracked by Drizzle metadata.

Common commands:

```bash
bun run db:generate   # generate SQL after schema changes
bun run db:check      # validate migration metadata and Drizzle migration consistency
bun run db:migrate    # apply migrations to DATABASE_URL/POSTGRES_URL
bun run db:push       # development-only schema push
```

Use separate databases for local, test, staging, and production. Never point local or CI workflows at staging or production.

### PgBouncer guidance

For serverless or high-concurrency deployments, point `DATABASE_URL` at PgBouncer. Use transaction pooling and keep migrations running against a direct administrative database URL when your platform requires it.

## Quality gates

Run the complete local CI sequence:

```bash
bun run ci
```

Individual checks:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

## Docker

Build the application image:

```bash
docker build -t ldo-edms:local .
```

Run infrastructure only:

```bash
docker compose up -d postgres redis
```

Run the app with the compose profile:

```bash
docker compose --profile app up -d --build
```

The container exposes `/api/health` as a Docker health check.

## CI/CD

GitHub Actions workflows are provided:

- `.github/workflows/ci.yml` installs dependencies, validates env/migrations, lints, type-checks, tests, and builds.
- `.github/workflows/deploy.yml` supports staging/production environments, migration execution, platform-specific deploy command injection, and post-deploy health checks.

Configure environment secrets/variables in GitHub:

- Secrets: `DATABASE_URL`, `AUTH_SECRET`, optional `REDIS_URL`, `DEPLOY_COMMAND`
- Variables: `NEXT_PUBLIC_APP_URL`, `DEPLOY_HEALTH_URL`, optional `STORAGE_NAS_PATH`

See `docs/deployment/README.md` for the deployment, monitoring, and rollback strategy.

## Health checks and operations

- Application health endpoint: `/api/health`
- Worker process: `bun run workers`
- Logs use structured logger helpers under `src/lib/logging/`
- Storage path defaults to `./storage` in development and should be a persistent NAS/volume in production

## Security notes

- Do not use placeholder `AUTH_SECRET` values outside local development.
- Keep real env files out of Git; `.gitignore` ignores `.env` and `.env.*` while allowing examples.
- Keep migrations backward-compatible for zero-downtime deployment and rollback.
