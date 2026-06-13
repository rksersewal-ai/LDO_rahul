# LDO-2 EDMS (Electronic Document Management System)

Railway document intelligence platform built with Next.js 14, tRPC, Drizzle ORM, and PostgreSQL.

## Getting Started

1. Copy `.env.example` to `.env.local` and configure your environment variables.
2. Install dependencies: `npm install`
3. Run database migrations (see [CI/CD Deployment](#cicd-deployment) below).
4. Start development server: `npm run dev`

---

## Database Connection Pooling (PgBouncer)

### Why PgBouncer?

In production, especially with serverless or edge deployments (Vercel, AWS Lambda, etc.), each request may open a new database connection. PostgreSQL has a hard connection limit (typically 100 by default), and serverless functions can easily exhaust this. PgBouncer acts as a lightweight connection pooler that sits between your application and PostgreSQL, multiplexing many client connections over a smaller number of actual database connections.

### Recommended Configuration

Add the following to your `pgbouncer.ini`:

```ini
[databases]
ldo2_edms = host=127.0.0.1 port=5432 dbname=ldo2_edms

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
listen_port = 6432
listen_addr = 0.0.0.0
```

Key settings:
- **pool_mode=transaction** - Connections are returned to the pool after each transaction completes, maximizing reuse.
- **max_client_conn=200** - Maximum number of client connections PgBouncer will accept.
- **default_pool_size=20** - Number of actual PostgreSQL connections maintained per database/user pair.

### Configuring DATABASE_URL for PgBouncer

Point your `DATABASE_URL` at PgBouncer instead of directly at PostgreSQL. The connection string format is the same; only the port changes (e.g., `6432` instead of `5432`):

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:6432/ldo2_edms
```

### Important: Prepared Statements

When using PgBouncer in `transaction` mode, prepared statements will not work correctly because the underlying connection may change between transactions. You must disable prepared statements in your PostgreSQL client.

For `node-postgres` (pg) which this project uses, ensure you pass `{ prepare: false }` or use the simple query protocol. In the Drizzle ORM configuration, this is handled by the connection pool settings in `src/lib/db/index.ts`. If you encounter errors like `prepared statement does not exist`, verify your Pool configuration includes:

```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // No additional statement_timeout or prepare options needed
  // PgBouncer handles the connection lifecycle
});
```

Alternatively, some ORMs and drivers support a `?pgbouncer=true` query parameter on the connection string that automatically enables simple protocol mode.

---

## CI/CD Deployment

### Running Migrations

Database migrations are stored as plain SQL files in the `drizzle/` directory. There are two approaches to applying them:

**Option A: Using drizzle-kit push (recommended for development and simple deployments)**

```bash
npx drizzle-kit push
```

This compares your Drizzle schema definitions against the live database and applies the necessary changes.

**Option B: Running migration SQL files directly (recommended for production CI/CD pipelines)**

```bash
# Apply all migration files in order
for f in drizzle/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

Or use your CI/CD platform's migration runner to execute each SQL file in sequence.

### Recommended Deployment Sequence

Follow this order in your CI/CD pipeline:

1. **Run migrations** - Apply schema changes to the database first.
2. **Build the application** - `npm run build` compiles the Next.js app.
3. **Deploy** - Roll out the new application code.

```yaml
# Example CI/CD step order
steps:
  - name: Run migrations
    run: npx drizzle-kit push
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

  - name: Build
    run: npm run build

  - name: Deploy
    run: ./deploy.sh
```

### Zero-Downtime Deployments

To ensure zero-downtime deployments, migrations must be **backward-compatible** with the currently running application code:

- **Adding columns:** Use nullable columns or provide defaults so the old code does not break.
- **Renaming columns:** Use a multi-step migration: add new column, deploy code that reads both, backfill, deploy code that reads only new column, drop old column.
- **Dropping columns:** Only drop columns after deploying code that no longer references them.
- **Adding tables:** Always safe.
- **Dropping tables:** Only after all references are removed from application code.

Never deploy a migration that removes or renames something the currently running application still uses.

---

## Production Security

### AUTH_SECRET

The `AUTH_SECRET` environment variable is used by NextAuth.js to sign and encrypt session tokens. In production, this **must** be set to a cryptographically random string of at least 32 bytes.

Generate a secure secret:

```bash
openssl rand -base64 32
```

**Never use the development default** (`dev-secret-key-for-local-development-only-change-in-production`) in production. If this value is not changed, session tokens can be forged by anyone who reads this repository.

### AUTH_TRUST_HOST

Set `AUTH_TRUST_HOST=true` **only** when the application is deployed behind a trusted reverse proxy (e.g., Nginx, Cloudflare, AWS ALB, Traefik). This tells NextAuth.js to trust the `X-Forwarded-Host` and `X-Forwarded-Proto` headers for constructing callback URLs.

- Do **not** set this in local development (it is not needed when accessing via `localhost`).
- Do **not** set this if the application is directly exposed to the internet without a reverse proxy, as it could allow host-header injection attacks.

See `.env.example` for the commented-out entry with further explanation.

### DATABASE_URL

The `DATABASE_URL` environment variable is **required** in production. The application includes a startup guard (`src/lib/db/env-check.ts`) that will refuse to start if `DATABASE_URL` is not set in a production environment. This prevents accidental deployments without a database connection.

---
