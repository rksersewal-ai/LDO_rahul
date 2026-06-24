# Login Troubleshooting Guide

## Problem
Login fails on https://ldo-rahul.vercel.app with error **"Invalid username or password"** even though:
- Admin user exists in the database
- Password hash is correct (`Admin@123`)
- Local/localhost login works fine

## Root Cause Analysis

The issue is a **branch deployment mismatch**:

1. **Current development branch**: `v0/rksersewal-4135-9a257314` contains all auth fixes:
   - `trustHost: true` for proxied environments
   - `NEXTAUTH_URL` auto-detection from `VERCEL_URL`
   - Proper cookie configuration for cross-origin iframe embedding
   - Admin password initialization in seed script

2. **Deployed version**: Vercel is deploying from a **different branch** (likely `main` or `dashboard-components-missing`) that:
   - **Does NOT have** the auth configuration fixes
   - Uses outdated NextAuth config that rejects the proxied host
   - Cannot properly validate CSRF tokens or set session cookies

## Solution

### Option A: Deploy from the Correct Branch (Recommended)

1. Go to Vercel Project Settings for `ldo-rahul`
2. Find "Deployments" or "Production Deployment Settings"
3. Change the "Production Branch" from `main` to `v0/rksersewal-4135-9a257314`
4. Trigger a redeploy

### Option B: Merge Changes to Main Branch

```bash
git checkout main
git merge v0/rksersewal-4135-9a257314
git push origin main
# Vercel will auto-redeploy
```

### Option C: Manual Database Password Reset (Temporary Fix)

If you can't redeploy, run the password reset script against production:

```bash
# In the v0 environment with production env vars loaded:
set -a && source /vercel/share/.env.project && set +a
NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/reset-admin-password.mjs
```

This will:
- Reset admin password to `Admin@123`
- Unlock the account if it was locked
- Update the password hash in the database

Note: This fixes the database but won't fix the **auth logic issue** on the deployed site.
The code still needs to be redeployed to handle proxied environments correctly.

## Key Commits with Auth Fixes

- `2aa075c` - Initial iframe + VERCEL_URL support
- `aaa2460` - Credentials provider + auth options
- `dc596ba` - Seed script password initialization

## Testing Locally

To verify everything works before deployment:

```bash
# In localhost (already tested ✓)
pnpm dev
# Navigate to http://localhost:3000/login
# Login as admin / Admin@123 → works

# Run seed to ensure admin password is correct
set -a && source /vercel/share/.env.project && set +a
NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/seed-mock-data.mjs
```

## What Each Script Does

**`scripts/seed-mock-data.mjs`** - Comprehensive seed with admin password:
- Creates org, workspace, users (admin + 3 engineers)
- Creates 8 PL numbers, 5 BOM products, 12 rolling stock units
- Creates 15 documents, 6 tags, 5 cabinets, 8 cases, 10 work records
- **Updates admin password to `Admin@123`**
- Idempotent (safe to run multiple times)

**`scripts/reset-admin-password.mjs`** - Standalone password reset:
- Only updates the admin user's password
- Unlocks the account if locked
- Useful for emergency fixes without running full seed

## Environment Variables Required (Vercel Project)

Ensure these are set in Vercel Project Settings > Environment Variables:

- `POSTGRES_URL` ✓ (from Supabase integration)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓ (from integration)
- `SUPABASE_SERVICE_ROLE_KEY` ✓ (from integration)
- `AUTH_SECRET` ✓ (auto-generated, should be set)
- `NEXTAUTH_URL` ← Should be auto-set to `https://ldo-rahul.vercel.app`

(Vercel URL auto-detection via `VERCEL_URL` env var is already in the code as fallback)

## Expected Behavior After Fix

1. **Login Page**: Loads correctly at https://ldo-rahul.vercel.app/login
2. **Submit Credentials**: `admin` / `Admin@123`
3. **Redirect**: → https://ldo-rahul.vercel.app/ (dashboard)
4. **Session Cookie**: Set with `HttpOnly`, `Secure`, `SameSite=None` for iframe embedding
5. **Dashboard**: Renders with real mock data (15 docs, 5 cases, 12 units, etc.)

## Additional Notes

- **Local testing works**: This confirms the auth logic and database are correct
- **Production fails**: This points to deployment/configuration issues
- **Database password verified**: The password hash is correct (`bcrypt.compare` passes)
- **No account lockout**: Admin account is active, failed attempts = 0

The fix is purely a deployment/branching issue, not a code issue.
