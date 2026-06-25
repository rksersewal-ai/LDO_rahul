# Deployment and Operations Guide

## Environments

Use separate PostgreSQL databases and secrets for each environment:

| Environment | Database | Purpose |
| --- | --- | --- |
| local | `ldo2_edms` via `docker-compose.yml` | Developer workflow |
| test | `ldo2_edms_test` in CI | Automated checks |
| staging | managed PostgreSQL staging DB | Release verification |
| production | managed PostgreSQL production DB | Live workload |

Never point local or CI jobs at staging/production databases.

## Required runtime variables

- `DATABASE_URL` or `POSTGRES_URL`
- `AUTH_SECRET` or `NEXTAUTH_SECRET` in production runtime
- `NEXT_PUBLIC_APP_URL`
- `STORAGE_NAS_PATH`

Optional integrations include `REDIS_URL` for queues/cache and `SMTP_*` for email.

Run this before deploying:

```bash
bun run validate:env
```

## Database workflow

- Generate migrations when schema changes: `bunx drizzle-kit generate`
- Validate migration metadata: `bun run db:check`
- Apply migrations: `bun run db:migrate`
- Seed required baseline data: `bun run seed`
- Seed demo/mock data only in non-production: `bun run seed:mock`

Production migrations must be backward-compatible with the previously deployed version.

## CI/CD flow

1. Install with `bun install --frozen-lockfile`.
2. Validate environment and migration metadata.
3. Run lint, type checks, tests, and production build.
4. Apply migrations.
5. Deploy the application artifact/image.
6. Verify `/api/health`.

## Rollback strategy

- Keep the previous container image or platform release available.
- Prefer backward-compatible migrations so the previous app can run after rollback.
- If a deployment health check fails, redeploy the previous known-good release and investigate logs.
- Do not run destructive migrations in the same release that removes code paths.

## Monitoring

Use `/api/health` for load balancer and post-deploy checks. Monitor application logs for structured error entries, PostgreSQL connection saturation, Redis availability, worker failures, and disk/NAS availability.
