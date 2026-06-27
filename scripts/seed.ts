/**
 * LDO-2 EDMS - Database Seed Script
 *
 * Creates default organization, workspace, admin user, and system settings.
 * Safe to run multiple times (uses ON CONFLICT DO NOTHING).
 *
 * Usage: npx tsx scripts/seed.ts
 */

import { hashSync } from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { organizations } from "../src/lib/db/schema/organizations";
import { settings } from "../src/lib/db/schema/settings";
import { userWorkspaces } from "../src/lib/db/schema/user-workspaces";
import { users } from "../src/lib/db/schema/users";
import { workspaces } from "../src/lib/db/schema/workspaces";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:5432/ldo2_edms";
const DEFAULT_DEV_ADMIN_PASSWORD = "Admin@123";

function getSeedAdminPassword(): string {
  const password = process.env.SEED_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (password) return password;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_ADMIN_PASSWORD is required when running the seed script in production.");
  }

  console.warn(
    "WARNING: using the development-only default admin password. Set SEED_ADMIN_PASSWORD for shared LAN environments.",
  );
  return DEFAULT_DEV_ADMIN_PASSWORD;
}

async function seed() {
  console.log("Connecting to database...");
  console.log(`  URL: ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  try {
    // 1. Create default organization
    console.log("\n1. Creating default organization...");
    await db
      .insert(organizations)
      .values({
        id: "org-default",
        name: "LDO-2 Chittaranjan",
        code: "LDO2-CLW",
        address: "Chittaranjan Locomotive Works, Chittaranjan, West Bengal",
        isActive: true,
      })
      .onConflictDoNothing({ target: organizations.id });
    console.log("   Done: org-default (LDO-2 Chittaranjan)");

    // 2. Create default workspace
    console.log("\n2. Creating default workspace...");
    await db
      .insert(workspaces)
      .values({
        id: "ws-default",
        orgId: "org-default",
        name: "Main Workshop",
        code: "MAIN",
        description: "Primary workshop workspace for LDO-2 Chittaranjan",
        isActive: true,
        storageQuotaGb: 500,
      })
      .onConflictDoNothing({ target: workspaces.id });
    console.log("   Done: ws-default (Main Workshop)");

    // 3. Create admin user
    console.log("\n3. Creating admin user...");
    const adminPassword = getSeedAdminPassword();
    const passwordHash = hashSync(adminPassword, 12);
    await db
      .insert(users)
      .values({
        id: "user-admin",
        username: "admin",
        email: "admin@ldo2.gov.in",
        passwordHash,
        name: "System Administrator",
        designation: "System Admin",
        department: "IT",
        section: "Infrastructure",
        employeeId: "EMP-ADMIN-001",
        role: "admin",
        isActive: true,
        forcePasswordChange: true,
        workspaceId: "ws-default",
      })
      .onConflictDoNothing({ target: users.id });
    console.log(
      `   Done: user-admin (admin@ldo2.gov.in / ${
        adminPassword === DEFAULT_DEV_ADMIN_PASSWORD ? "development default" : "provided secret"
      }; password change required)`,
    );

    // 4. Link admin user to workspace
    console.log("\n4. Linking admin user to workspace...");
    await db
      .insert(userWorkspaces)
      .values({
        userId: "user-admin",
        workspaceId: "ws-default",
        role: "admin",
        isPrimary: true,
        assignedBy: "system",
      })
      .onConflictDoNothing();
    console.log("   Done: user-admin -> ws-default (admin, primary)");

    // 5. Insert default system settings
    console.log("\n5. Inserting default system settings...");
    const defaultSettings = [
      {
        id: "setting-feature-toggles",
        scope: "system" as const,
        scopeId: null,
        key: "feature_toggles",
        value: JSON.stringify({
          ocr_processing: true,
          document_versioning: true,
          approval_workflows: true,
          bom_management: true,
          pl_knowledge_hub: true,
          work_ledger: true,
          deduplication: true,
          offline_mode: false,
          ai_classification: false,
        }),
        dataType: "json" as const,
        description: "Global feature toggle flags",
        isPublic: true,
        updatedBy: "system",
      },
      {
        id: "setting-security-policy",
        scope: "system" as const,
        scopeId: null,
        key: "security_policy",
        value: JSON.stringify({
          max_failed_logins: 5,
          lockout_duration_minutes: 30,
          password_min_length: 8,
          password_require_uppercase: true,
          password_require_number: true,
          password_require_special: true,
          session_timeout_minutes: 480,
          force_password_change_days: 90,
        }),
        dataType: "json" as const,
        description: "System-wide security policies",
        isPublic: false,
        updatedBy: "system",
      },
      {
        id: "setting-storage-config",
        scope: "system" as const,
        scopeId: null,
        key: "storage_config",
        value: JSON.stringify({
          max_file_size_mb: 100,
          allowed_extensions: [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "dwg",
            "dxf",
            "png",
            "jpg",
            "tiff",
          ],
          thumbnail_enabled: true,
          virus_scan_enabled: false,
        }),
        dataType: "json" as const,
        description: "File storage configuration",
        isPublic: false,
        updatedBy: "system",
      },
    ];

    for (const setting of defaultSettings) {
      await db.insert(settings).values(setting).onConflictDoNothing({ target: settings.id });
    }
    console.log("   Done: feature_toggles, security_policy, storage_config");

    // Verify
    console.log("\n--- Seed Summary ---");
    const orgCount = await db.select({ count: sql<number>`count(*)` }).from(organizations);
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const wsCount = await db.select({ count: sql<number>`count(*)` }).from(workspaces);
    console.log(`  Organizations: ${orgCount[0].count}`);
    console.log(`  Workspaces:    ${wsCount[0].count}`);
    console.log(`  Users:         ${userCount[0].count}`);
    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("\nSeed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
