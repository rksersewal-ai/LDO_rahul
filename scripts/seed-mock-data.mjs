/**
 * LDO-2 EDMS - Mock/Sample Data Seed
 *
 * Populates the linked database with realistic sample content (PL numbers,
 * BOM products + entries, rolling stock, documents, cases, work records, tags,
 * cabinets, notifications and a few extra users) so the runtime preview shows
 * actual data on every page instead of empty states.
 *
 * Idempotent: every row uses a fixed id with ON CONFLICT (id) DO NOTHING,
 * so it is safe to run multiple times.
 *
 * Usage:
 *   set -a && source /vercel/share/.env.project && set +a \
 *     && NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/seed-mock-data.mjs
 */

import { hashSync } from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/ldo2_edms";

const WS = "ws-default";
const ORG = "org-default";
const ADMIN = "user-admin";

// Spread timestamps over the last N days so dashboards/charts look realistic.
const now = Date.now();
const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000);

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

/**
 * Insert rows with ON CONFLICT (id) DO NOTHING.
 * `rows` is an array of plain objects keyed by snake_case column name.
 */
async function insert(table, rows, conflictTarget = "id") {
  let inserted = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map((c) => row[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const quotedCols = cols.map((c) => `"${c}"`).join(", ");
    const res = await pool.query(
      `INSERT INTO "${table}" (${quotedCols}) VALUES (${placeholders})
       ON CONFLICT (${conflictTarget}) DO NOTHING`,
      vals,
    );
    inserted += res.rowCount;
  }
  console.log(`  ${table}: +${inserted} (of ${rows.length})`);
  return inserted;
}

async function seed() {
  console.log(`Connecting to ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  try {
    // ---- Extra users (engineers / reviewers) for assignments & approvals ----
    console.log("\nUsers...");
    const pwd = hashSync("Passw0rd@123", 12);
    await insert("users", [
      {
        id: "user-eng-01",
        username: "r.banerjee",
        email: "r.banerjee@ldo2.gov.in",
        password_hash: pwd,
        name: "Rahul Banerjee",
        designation: "Senior Engineer",
        department: "Mechanical",
        section: "Loco Assembly",
        employee_id: "EMP-ME-2041",
        role: "engineer",
        is_active: true,
        force_password_change: false,
        workspace_id: WS,
      },
      {
        id: "user-eng-02",
        username: "s.iyer",
        email: "s.iyer@ldo2.gov.in",
        password_hash: pwd,
        name: "Sunita Iyer",
        designation: "Design Engineer",
        department: "Design",
        section: "Bogie Design",
        employee_id: "EMP-DS-1187",
        role: "engineer",
        is_active: true,
        force_password_change: false,
        workspace_id: WS,
      },
      {
        id: "user-rev-01",
        username: "a.khan",
        email: "a.khan@ldo2.gov.in",
        password_hash: pwd,
        name: "Arif Khan",
        designation: "Quality Reviewer",
        department: "QA",
        section: "Inspection",
        employee_id: "EMP-QA-3322",
        role: "reviewer",
        is_active: true,
        force_password_change: false,
        workspace_id: WS,
      },
    ]);
    await insert(
      "user_workspaces",
      [
        { user_id: "user-eng-01", workspace_id: WS, role: "engineer", is_primary: true, assigned_by: ADMIN },
        { user_id: "user-eng-02", workspace_id: WS, role: "engineer", is_primary: true, assigned_by: ADMIN },
        { user_id: "user-rev-01", workspace_id: WS, role: "reviewer", is_primary: true, assigned_by: ADMIN },
      ],
      "user_id, workspace_id",
    );

    // ---- PL numbers (railway part-list knowledge hub) ----
    console.log("\nPL numbers...");
    const pls = [
      { id: "pl-100", pl_number: "16734310", name: "Traction Motor TM-15", category: "CAT-A", safety_critical: true, manufacturer: "BHEL", part_family: "Traction", item_type: "VD", inspection_agency: "RDSO" },
      { id: "pl-101", pl_number: "16734328", name: "Brake Cylinder Assembly", category: "CAT-A", safety_critical: true, manufacturer: "Knorr-Bremse", part_family: "Brakes", item_type: "VD", inspection_agency: "RDSO" },
      { id: "pl-102", pl_number: "16720045", name: "Bogie Frame Casting", category: "CAT-B", safety_critical: true, manufacturer: "Texmaco", part_family: "Bogie", item_type: "VD", inspection_agency: "ZONAL" },
      { id: "pl-103", pl_number: "16710092", name: "Roof Mounted AC Package", category: "CAT-B", safety_critical: false, manufacturer: "Stesalit", part_family: "HVAC", item_type: "VD", inspection_agency: "WORKSHOP" },
      { id: "pl-104", pl_number: "16702213", name: "Axle Box Bearing", category: "CAT-A", safety_critical: true, manufacturer: "SKF", part_family: "Running Gear", item_type: "VD", inspection_agency: "RDSO" },
      { id: "pl-105", pl_number: "16688170", name: "Pantograph High Reach", category: "CAT-A", safety_critical: true, manufacturer: "Faiveley", part_family: "Current Collection", item_type: "VD", inspection_agency: "RDSO" },
      { id: "pl-106", pl_number: "16655401", name: "Coupler Draft Gear", category: "CAT-C", safety_critical: false, manufacturer: "Escorts", part_family: "Coupling", item_type: "NVD", inspection_agency: "STORES" },
      { id: "pl-107", pl_number: "16640088", name: "Control Electronics Card VCU", category: "CAT-B", safety_critical: false, manufacturer: "Medha", part_family: "Electronics", item_type: "VD", inspection_agency: "WORKSHOP" },
    ];
    await insert(
      "pl_numbers",
      pls.map((p, i) => ({
        id: p.id,
        pl_number: p.pl_number,
        name: p.name,
        description: `${p.name} — standard issue for LDO-2 Chittaranjan workshop builds.`,
        category: p.category,
        status: "active",
        safety_critical: p.safety_critical,
        drawing_ref: `CLW/SK-${3000 + i}`,
        specification: `IRS R-${100 + i}`,
        unit: "nos",
        workshop: "Main Workshop",
        manufacturer: p.manufacturer,
        part_family: p.part_family,
        lifecycle_stage: "active",
        item_type: p.item_type,
        inspection_agency: p.inspection_agency,
        unit_of_measurement: "EA",
        created_by: ADMIN,
        workspace_id: WS,
        created_at: daysAgo(80 - i * 5),
        updated_at: daysAgo(10),
      })),
    );

    // ---- BOM products + entries ----
    console.log("\nBOM products & entries...");
    const products = [
      { id: "bom-wag9", code: "WAG-9", name: "WAG-9 Freight Locomotive", type: "locomotive", gauge: "broad_gauge", pl: "pl-100" },
      { id: "bom-wap7", code: "WAP-7", name: "WAP-7 Passenger Locomotive", type: "locomotive", gauge: "broad_gauge", pl: "pl-100" },
      { id: "bom-lhb", code: "LHB-AC3", name: "LHB AC 3-Tier Coach", type: "coach", gauge: "broad_gauge", pl: "pl-103" },
      { id: "bom-bogie", code: "FIAT-BOGIE", name: "FIAT Bogie Assembly", type: "assembly", gauge: "broad_gauge", pl: "pl-102" },
      { id: "bom-traction", code: "TRAC-PKG", name: "Traction Package 3-Phase", type: "sub_assembly", gauge: "broad_gauge", pl: "pl-100" },
    ];
    await insert(
      "bom_products",
      products.map((p, i) => ({
        id: p.id,
        product_code: p.code,
        name: p.name,
        description: `${p.name} bill of materials.`,
        version: "1.0",
        pl_number_id: p.pl,
        created_by: ADMIN,
        workspace_id: WS,
        approval_status: i % 3 === 0 ? "approved" : "draft",
        product_type: p.type,
        gauge: p.gauge,
        created_at: daysAgo(70 - i * 4),
        updated_at: daysAgo(8),
      })),
    );
    const entryParts = [
      ["Traction Motor TM-15", "16734310", "pl-100", "Cast Steel", 6],
      ["Brake Cylinder Assembly", "16734328", "pl-101", "Forged Steel", 8],
      ["Bogie Frame Casting", "16720045", "pl-102", "Cast Iron", 2],
      ["Axle Box Bearing", "16702213", "pl-104", "Bearing Steel", 12],
      ["Coupler Draft Gear", "16655401", "pl-106", "Alloy Steel", 2],
      ["VCU Electronics Card", "16640088", "pl-107", "PCB", 4],
    ];
    const entries = [];
    let e = 0;
    for (const prod of products) {
      entryParts.forEach((part, idx) => {
        e += 1;
        entries.push({
          id: `bome-${prod.id}-${idx + 1}`,
          bom_product_id: prod.id,
          item_number: idx + 1,
          part_name: part[0],
          part_number: part[1],
          pl_number_id: part[2],
          quantity: part[4],
          unit: "nos",
          material: part[3],
          specification: `IRS R-${100 + idx}`,
          drawing_ref: `CLW/SK-${3000 + idx}`,
          position: idx,
          type: "part",
          is_active: true,
        });
      });
    }
    await insert("bom_entries", entries);

    // ---- Rolling stock units ----
    console.log("\nRolling stock units...");
    const statuses = ["active", "active", "under_overhaul", "active", "awaiting_commissioning", "transferred", "active", "condemned", "active", "under_overhaul", "active", "active"];
    const rsRows = Array.from({ length: 12 }).map((_, i) => {
      const isWap = i % 2 === 0;
      return {
        id: `rs-${String(i + 1).padStart(3, "0")}`,
        workspace_id: WS,
        product_id: isWap ? "bom-wap7" : "bom-wag9",
        unit_number: `${isWap ? "WAP7" : "WAG9"}-${31200 + i}`,
        serial_number: `CLW-${2023}-${4000 + i}`,
        manufactured_date: daysAgo(400 - i * 20),
        commissioning_date: daysAgo(360 - i * 20),
        status: statuses[i],
        home_workshop: "CLW Chittaranjan",
        current_location: i % 3 === 0 ? "ELS Howrah" : "CLW Chittaranjan",
        notes: i % 4 === 0 ? "Scheduled for IOH inspection." : null,
        created_by: ADMIN,
        created_at: daysAgo(360 - i * 20),
        updated_at: daysAgo(i),
      };
    });
    await insert("rolling_stock_units", rsRows);

    // ---- Tags ----
    console.log("\nTags...");
    await insert("tags", [
      { id: "tag-01", workspace_id: WS, name: "Safety Critical", color: "#DC2626", created_by: ADMIN },
      { id: "tag-02", workspace_id: WS, name: "RDSO Approved", color: "#16A34A", created_by: ADMIN },
      { id: "tag-03", workspace_id: WS, name: "Revision Pending", color: "#D97706", created_by: ADMIN },
      { id: "tag-04", workspace_id: WS, name: "Vendor Document", color: "#2563EB", created_by: ADMIN },
      { id: "tag-05", workspace_id: WS, name: "Archived", color: "#6B7280", created_by: ADMIN },
      { id: "tag-06", workspace_id: WS, name: "Inspection Report", color: "#7C3AED", created_by: ADMIN },
    ]);

    // ---- Cabinets (with hierarchy) ----
    console.log("\nCabinets...");
    await insert("cabinets", [
      { id: "cab-01", workspace_id: WS, name: "Locomotive Drawings", description: "All loco GA & sub-assembly drawings", color: "#2563EB", icon: "folder", created_by: ADMIN },
      { id: "cab-02", workspace_id: WS, name: "Coach Documents", description: "LHB / ICF coach documentation", color: "#16A34A", icon: "folder", created_by: ADMIN },
      { id: "cab-03", workspace_id: WS, name: "Quality Certificates", description: "Test & material certificates", color: "#D97706", icon: "folder", created_by: ADMIN },
    ]);
    await insert("cabinets", [
      { id: "cab-04", workspace_id: WS, name: "WAG-9", description: "WAG-9 specific drawings", parent_id: "cab-01", color: "#3B82F6", icon: "folder", created_by: ADMIN },
      { id: "cab-05", workspace_id: WS, name: "WAP-7", description: "WAP-7 specific drawings", parent_id: "cab-01", color: "#3B82F6", icon: "folder", created_by: ADMIN },
    ]);

    // ---- Documents ----
    console.log("\nDocuments...");
    const docDefs = [
      ["GA Drawing WAG-9 Locomotive", "DRAWING", "approved", "cab-04"],
      ["Bogie Frame Fabrication Drawing", "DRAWING", "approved", "cab-04"],
      ["Traction Motor TM-15 Specification", "SPECIFICATION", "approved", "cab-04"],
      ["Brake System Test Certificate", "TEST_CERTIFICATE", "approved", "cab-03"],
      ["Axle Box Bearing Material Cert", "MATERIAL_CERTIFICATE", "approved", "cab-03"],
      ["LHB Coach Wiring Diagram", "WIRING_DIAGRAM", "under_review", "cab-02"],
      ["Pantograph Inspection Report Q2", "INSPECTION_REPORT", "pending_review", "cab-03"],
      ["WAP-7 Set List Rev C", "SET_LIST", "approved", "cab-05"],
      ["Quality Assurance Plan - Traction", "QAP", "draft", "cab-03"],
      ["Vendor Document - SKF Bearing", "VENDOR_DOCUMENT", "approved", "cab-03"],
      ["Eligibility Criteria - Coupler", "ELIGIBILITY_CRITERIA", "approved", "cab-02"],
      ["Maintenance Manual WAG-9", "MANUAL", "approved", "cab-04"],
      ["Schedule of Requirements 2024", "SOR", "under_review", null],
      ["Work Order Procedure IOH", "PROCEDURE", "approved", null],
      ["Correspondence - RDSO Clarification", "CORRESPONDENCE", "draft", null],
    ];
    const docRows = docDefs.map((d, i) => ({
      id: `doc-${String(i + 1).padStart(3, "0")}`,
      document_number: `CLW/DOC/2024/${String(i + 1).padStart(4, "0")}`,
      title: d[0],
      description: `${d[0]} for LDO-2 Chittaranjan.`,
      category: d[1],
      status: d[2],
      revision: String.fromCharCode(65 + (i % 3)),
      file_hash: `hash${String(i).padStart(60, "0")}`.slice(0, 64),
      file_path: `/storage/docs/doc-${String(i + 1).padStart(3, "0")}.pdf`,
      file_size: 250000 + i * 12000,
      mime_type: "application/pdf",
      original_filename: `${d[0].replace(/[^a-z0-9]+/gi, "_")}.pdf`,
      ocr_status: i % 4 === 0 ? "completed" : "not_required",
      ocr_confidence: i % 4 === 0 ? 0.94 : null,
      page_count: 1 + (i % 8),
      workshop: "Main Workshop",
      section: "Engineering",
      created_by: ADMIN,
      approved_by: d[2] === "approved" ? "user-rev-01" : null,
      approved_at: d[2] === "approved" ? daysAgo(20 - (i % 10)) : null,
      workspace_id: WS,
      created_at: daysAgo(60 - i * 3),
      updated_at: daysAgo(i),
    }));
    await insert("documents", docRows, "document_number");

    // Link a few documents to tags & cabinets
    await insert(
      "document_tags",
      [
        { document_id: "doc-001", tag_id: "tag-01", tagged_by: ADMIN },
        { document_id: "doc-003", tag_id: "tag-02", tagged_by: ADMIN },
        { document_id: "doc-006", tag_id: "tag-03", tagged_by: ADMIN },
        { document_id: "doc-010", tag_id: "tag-04", tagged_by: ADMIN },
        { document_id: "doc-007", tag_id: "tag-06", tagged_by: ADMIN },
      ],
      "document_id, tag_id",
    );
    await insert(
      "document_cabinets",
      [
        { document_id: "doc-001", cabinet_id: "cab-04", added_by: ADMIN },
        { document_id: "doc-008", cabinet_id: "cab-05", added_by: ADMIN },
        { document_id: "doc-004", cabinet_id: "cab-03", added_by: ADMIN },
      ],
      "document_id, cabinet_id",
    );

    // Link some PLs to documents (eligibility / STR / QAP)
    await pool.query(
      `UPDATE pl_numbers SET eligibility_criteria_doc_id = 'doc-011' WHERE id = 'pl-106'`,
    );
    await pool.query(`UPDATE pl_numbers SET qap_doc_id = 'doc-009' WHERE id = 'pl-100'`);

    // ---- Cases ----
    console.log("\nCases...");
    const caseDefs = [
      ["Premature bearing wear on WAG9-31200", "investigating", "high", "Quality", "user-eng-01", "Rahul Banerjee"],
      ["Brake cylinder leakage during testing", "open", "critical", "Safety", "user-rev-01", "Arif Khan"],
      ["Drawing revision mismatch - bogie", "resolved", "medium", "Documentation", "user-eng-02", "Sunita Iyer"],
      ["Vendor delay - SKF bearings", "open", "low", "Procurement", "user-eng-01", "Rahul Banerjee"],
      ["Pantograph arcing reported ELS Howrah", "escalated", "high", "Maintenance", "user-rev-01", "Arif Khan"],
      ["AC package noise complaint LHB", "investigating", "medium", "Comfort", "user-eng-02", "Sunita Iyer"],
      ["Coupler draft gear tolerance issue", "closed", "low", "Quality", "user-eng-01", "Rahul Banerjee"],
      ["VCU firmware version conflict", "open", "high", "Electronics", "user-eng-02", "Sunita Iyer"],
    ];
    await insert(
      "cases",
      caseDefs.map((c, i) => ({
        id: `case-${String(i + 1).padStart(3, "0")}`,
        workspace_id: WS,
        case_number: `CASE-2024-${String(i + 1).padStart(4, "0")}`,
        title: c[0],
        description: `${c[0]}. Logged for investigation and disposal.`,
        case_status: c[1],
        case_priority: c[2],
        category: c[3],
        assigned_to: c[4],
        assignee_name: c[5],
        reporter_id: ADMIN,
        reporter_name: "System Administrator",
        related_pl_id: pls[i % pls.length].id,
        resolved_at: c[1] === "resolved" || c[1] === "closed" ? daysAgo(5 + i) : null,
        closed_at: c[1] === "closed" ? daysAgo(3 + i) : null,
        created_by: ADMIN,
        created_at: daysAgo(45 - i * 4),
        updated_at: daysAgo(i),
      })),
      "case_number",
    );

    // ---- Work records ----
    console.log("\nWork records...");
    const wrDefs = [
      ["IOH WAG9-31200 Traction Motor", "in_progress", "high", "user-eng-01"],
      ["Brake cylinder replacement WAP7-31201", "open", "critical", "user-rev-01"],
      ["Bogie overhaul WAG9-31202", "completed", "medium", "user-eng-02"],
      ["Bearing inspection WAP7-31203", "in_progress", "high", "user-eng-01"],
      ["Pantograph service WAG9-31204", "on_hold", "medium", "user-eng-02"],
      ["Coupler refit WAP7-31205", "open", "low", "user-eng-01"],
      ["VCU card swap WAG9-31206", "completed", "high", "user-rev-01"],
      ["AC package cleaning WAP7-31207", "open", "low", "user-eng-02"],
      ["Wheel profiling WAG9-31208", "in_progress", "medium", "user-eng-01"],
      ["Condemnation survey WAP7-31209", "open", "high", "user-rev-01"],
    ];
    await insert(
      "work_records",
      wrDefs.map((w, i) => ({
        id: `wr-${String(i + 1).padStart(3, "0")}`,
        work_order_number: `WO-2024-${String(i + 1).padStart(4, "0")}`,
        title: w[0],
        description: `${w[0]} — workshop job card.`,
        pl_number_id: pls[i % pls.length].id,
        rolling_stock_unit_id: `rs-${String((i % 12) + 1).padStart(3, "0")}`,
        status: w[1],
        priority: w[2],
        quantity: 1 + (i % 4),
        loco_number: rsRows[i % 12].unit_number,
        workshop: "Main Workshop",
        section: "Heavy Repair",
        assigned_to: w[3],
        completed_at: w[1] === "completed" ? daysAgo(4 + i) : null,
        due_date: daysAgo(-(7 + i)),
        created_by: ADMIN,
        workspace_id: WS,
        created_at: daysAgo(40 - i * 3),
        updated_at: daysAgo(i),
        sync_status: "synced",
      })),
      "work_order_number",
    );

    // ---- Notifications (for admin) ----
    console.log("\nNotifications...");
    await insert("notifications", [
      { id: "ntf-01", user_id: ADMIN, notification_type: "approval_request", title: "Approval requested", message: "QAP - Traction (doc-009) awaits your approval.", entity_type: "document", entity_id: "doc-009", is_read: false, action_url: "/documents/doc-009", workspace_id: WS, created_at: daysAgo(1) },
      { id: "ntf-02", user_id: ADMIN, notification_type: "document_upload", title: "New document uploaded", message: "Schedule of Requirements 2024 was uploaded.", entity_type: "document", entity_id: "doc-013", is_read: false, action_url: "/documents/doc-013", workspace_id: WS, created_at: daysAgo(2) },
      { id: "ntf-03", user_id: ADMIN, notification_type: "case_assigned", title: "Case escalated", message: "CASE-2024-0005 (Pantograph arcing) was escalated.", entity_type: "case", entity_id: "case-005", is_read: false, action_url: "/cases/case-005", workspace_id: WS, created_at: daysAgo(3) },
      { id: "ntf-04", user_id: ADMIN, notification_type: "document_comment", title: "New comment", message: "Sunita Iyer commented on the LHB wiring diagram.", entity_type: "document", entity_id: "doc-006", is_read: true, read_at: daysAgo(3), action_url: "/documents/doc-006", workspace_id: WS, created_at: daysAgo(4) },
      { id: "ntf-05", user_id: ADMIN, notification_type: "approval_decision", title: "Document approved", message: "WAP-7 Set List Rev C was approved.", entity_type: "document", entity_id: "doc-008", is_read: true, read_at: daysAgo(6), action_url: "/documents/doc-008", workspace_id: WS, created_at: daysAgo(6) },
      { id: "ntf-06", user_id: ADMIN, notification_type: "system", title: "Welcome to LDO-2 EDMS", message: "Sample data has been loaded for preview.", entity_type: null, entity_id: null, is_read: true, read_at: daysAgo(7), action_url: null, workspace_id: WS, created_at: daysAgo(7) },
    ]);

    // ---- Summary ----
    console.log("\n--- Summary ---");
    for (const t of ["users", "pl_numbers", "bom_products", "bom_entries", "rolling_stock_units", "documents", "tags", "cabinets", "cases", "work_records", "notifications"]) {
      const r = await pool.query(`SELECT count(*)::int AS c FROM "${t}"`);
      console.log(`  ${t.padEnd(22)} ${r.rows[0].c}`);
    }
    console.log("\nMock data seed completed successfully.");
  } catch (err) {
    console.error("\nSeed failed:", err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
