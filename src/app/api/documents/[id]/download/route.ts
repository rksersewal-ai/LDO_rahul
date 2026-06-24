import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { checkDocumentAccess } from "@/lib/access/check-access";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { logError } from "@/lib/logging/structured-logger";
import { isHashRemoved } from "@/lib/storage/hash-removal";
import { getFile } from "@/lib/storage/nas-storage";

/**
 * Secure document download / inline preview.
 *
 * GET /api/documents/:id/download[?disposition=attachment]
 *
 * Enforces, in order: authentication, workspace isolation, clearance level, the
 * no-hard-delete removed-hash flag, and physical availability — then streams the
 * stored bytes from NAS and writes a tamper-evident DOWNLOAD audit entry.
 *
 * Note: this serves files for documents whose bytes have been persisted to NAS
 * (i.e. `file_path` is populated). It never bypasses the access checks above.
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  const disposition =
    new URL(_req.url).searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

  const [doc] = await db
    .select({
      id: documents.id,
      title: documents.title,
      documentNumber: documents.documentNumber,
      fileHash: documents.fileHash,
      filePath: documents.filePath,
      mimeType: documents.mimeType,
      originalFilename: documents.originalFilename,
      fileSize: documents.fileSize,
      workspaceId: documents.workspaceId,
      clearanceRequired: documents.clearanceRequired,
      isDeleted: documents.isDeleted,
    })
    .from(documents)
    .where(eq(documents.id, id));

  // Hide soft-deleted / non-existent documents behind a single 404.
  // isDeleted is stored as integer(0/1); compare to 0 to handle both integer
  // and boolean coercions until a migration canonicalises the column type.
  if (doc?.isDeleted !== 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const parsedClearance = Number.parseInt(String(session.user.clearanceLevel ?? "1"), 10);
  const userClearance = isAdmin
    ? Number.MAX_SAFE_INTEGER
    : Number.isFinite(parsedClearance) && parsedClearance > 0
      ? parsedClearance
      : 1;

  const access = checkDocumentAccess({
    userWorkspaceId: session.user.workspaceId ?? "",
    userClearanceLevel: userClearance,
    documentWorkspaceId: doc.workspaceId,
    documentClearanceRequired: doc.clearanceRequired ?? 1,
    isAdmin,
  });

  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? "Access denied" }, { status: 403 });
  }

  // No-hard-delete: a logically removed hash must not be served.
  if (doc.fileHash && (await isHashRemoved(doc.fileHash))) {
    return NextResponse.json(
      { error: "File content has been removed and is not available." },
      { status: 410 },
    );
  }

  if (!doc.filePath) {
    return NextResponse.json(
      { error: "No file is associated with this document." },
      { status: 404 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = await getFile(doc.filePath);
  } catch (error) {
    logError(
      "Failed to read document file from storage",
      { path: "/api/documents/[id]/download", code: id },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json({ error: "File is currently unavailable." }, { status: 404 });
  }

  // Best-effort audit (never blocks the download on audit failure).
  try {
    await createAuditEntry(db, {
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      action: "DOWNLOAD",
      resourceType: "document",
      resourceId: doc.id,
      resourceTitle: doc.title,
      workspaceId: doc.workspaceId ?? undefined,
      details: `Downloaded document ${doc.documentNumber} (${disposition})`,
    });
  } catch (error) {
    logError(
      "Failed to write DOWNLOAD audit entry",
      { path: "/api/documents/[id]/download", code: id },
      error instanceof Error ? error : undefined,
    );
  }

  const filename = (doc.originalFilename ?? `${doc.documentNumber}`).replace(/"/g, "");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      // Sensitive content — never cache in shared/proxy caches.
      "Cache-Control": "private, no-store",
    },
  });
}
