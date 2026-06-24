#!/usr/bin/env node

/**
 * Reset admin user password to Admin@123 for demo/testing
 *
 * This standalone script resets the admin account password and unlocks it if
 * it was locked due to failed login attempts. Useful for production deployments
 * where the password hash doesn't match or the account got locked.
 *
 * Usage:
 *   set -a && source /vercel/share/.env.project && set +a \
 *     && NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/reset-admin-password.mjs
 */

import { hashSync } from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/ldo2_edms";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function resetAdminPassword() {
  console.log(`Connecting to ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  try {
    const newPassword = "Admin@123";
    const passwordHash = hashSync(newPassword, 12);

    console.log("\nResetting admin password...");
    const result = await pool.query(
      `UPDATE "users"
       SET password_hash = $1,
           failed_login_attempts = 0,
           locked_at = NULL,
           lock_reason = NULL,
           password_changed_at = now(),
           updated_at = now()
       WHERE username = $2
       RETURNING id, username, email, is_active, locked_at, failed_login_attempts`,
      [passwordHash, "admin"],
    );

    if (result.rows.length === 0) {
      console.log("❌ admin user not found");
      process.exit(1);
    }

    const user = result.rows[0];
    console.log("✓ admin password reset successfully");
    console.log("  User:", user);
    console.log(`\n  Login with: admin / ${newPassword}`);

    // Verify the password works
    const { compare } = await import("bcryptjs");
    const verifyResult = await pool.query(
      `SELECT password_hash FROM "users" WHERE username = $1`,
      ["admin"],
    );

    if (verifyResult.rows.length > 0) {
      const passwordMatches = await compare(
        newPassword,
        verifyResult.rows[0].password_hash,
      );
      console.log(`\n✓ Password verification: ${passwordMatches ? "PASSED" : "FAILED"}`);
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting password:", err.message);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();
