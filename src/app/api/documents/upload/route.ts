import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isRoleAtLeast } from "@/lib/auth/permissions";
import { logError } from "@/lib/logging/structured-logger";
import type { UserRole } from "@/lib/types/auth";
import {
  type ProcessUploadResult,
  processDocumentUpload,
  UploadError,
} from "@/lib/upload/process-upload";
import { uploadDocumentSchema } from "@/lib/validators/documents";

// Largest accepted upload (default 500MB to match the dropzone UI).
const MAX_UPLOAD_BYTES = Number(process.env.DOC_MAX_UPLOAD_BYTES ?? `${500 * 1024 * 1024}`);

/**
 * Authenticated multipart document upload.
 *
 * POST /api/documents/upload
 *   form-data: file=<binary>, metadata=<JSON of uploadDocumentSchema>,
 *              clearanceRequired=<number?>
 *
 * Runs the full pipeline (validate -> hash -> quota -> NAS -> DB -> OCR enqueue)
 * via processDocumentUpload and maps domain errors to HTTP status codes.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Upload requires engineer role or higher (matches engineerProcedure).
  if (!isRoleAtLeast(session.user.role as UserRole, "engineer")) {
    return NextResponse.json(
      { error: "You do not have permission to upload documents." },
      { status: 403 },
    );
  }

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "No workspace assigned. Contact an administrator." },
      { status: 412 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds the maximum size of ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
      },
      { status: 413 },
    );
  }

  // Parse + validate metadata.
  const rawMeta = form.get("metadata");
  if (typeof rawMeta !== "string") {
    return NextResponse.json({ error: "Missing document metadata." }, { status: 400 });
  }

  let parsedMeta: unknown;
  try {
    parsedMeta = JSON.parse(rawMeta);
  } catch {
    return NextResponse.json({ error: "Malformed metadata JSON." }, { status: 400 });
  }

  const metaResult = uploadDocumentSchema.safeParse(parsedMeta);
  if (!metaResult.success) {
    return NextResponse.json(
      { error: "Invalid metadata.", details: metaResult.error.flatten() },
      { status: 400 },
    );
  }

  const clearanceRaw = form.get("clearanceRequired");
  const clearanceRequired =
    typeof clearanceRaw === "string" && clearanceRaw.trim() !== ""
      ? Number(clearanceRaw)
      : undefined;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file." }, { status: 400 });
  }

  try {
    const result: ProcessUploadResult = await processDocumentUpload({
      buffer,
      originalFilename: file.name,
      metadata: metaResult.data,
      workspaceId,
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      clearanceRequired:
        clearanceRequired !== undefined && Number.isFinite(clearanceRequired)
          ? clearanceRequired
          : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    logError(
      "Unexpected error during document upload",
      { path: "/api/documents/upload" },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json({ error: "Upload failed unexpectedly." }, { status: 500 });
  }
}
