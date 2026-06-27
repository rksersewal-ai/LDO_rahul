import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentShareLinks, documents } from "@/lib/db/schema";
import { logError } from "@/lib/logging/structured-logger";
import { isHashRemoved } from "@/lib/storage/hash-removal";
import { getFile } from "@/lib/storage/nas-storage";
import { checkRateLimitKey } from "@/server/middleware/rate-limit";

interface ShareDownloadContext {
  params: Promise<{ token: string }>;
}

async function readPassword(req: NextRequest): Promise<string | undefined> {
  if (req.method === "GET") {
    return new URL(req.url).searchParams.get("password") ?? undefined;
  }

  try {
    const body = (await req.json()) as { password?: unknown };
    return typeof body.password === "string" ? body.password : undefined;
  } catch {
    return undefined;
  }
}

async function serveSharedDocument(req: NextRequest, context: ShareDownloadContext) {
  const { token } = await context.params;
  if (token.length !== 48) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  await checkRateLimitKey(`share-download:${token}`, { maxRequests: 20 });

  const url = new URL(req.url);
  const requestedAttachment = url.searchParams.get("disposition") === "attachment";
  const password = await readPassword(req);

  const [link] = await db
    .select()
    .from(documentShareLinks)
    .where(eq(documentShareLinks.token, token));

  if (!link || link.isRevoked === 1) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }
  if (link.maxViews !== null && link.viewCount >= link.maxViews) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }
  if (requestedAttachment && link.allowDownload !== 1) {
    return NextResponse.json(
      { error: "Downloads are disabled for this share link" },
      { status: 403 },
    );
  }
  if (link.passwordHash) {
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, link.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  }

  const [doc] = await db
    .select({
      id: documents.id,
      title: documents.title,
      documentNumber: documents.documentNumber,
      fileHash: documents.fileHash,
      filePath: documents.filePath,
      mimeType: documents.mimeType,
      originalFilename: documents.originalFilename,
      isDeleted: documents.isDeleted,
    })
    .from(documents)
    .where(and(eq(documents.id, link.documentId), eq(documents.isDeleted, 0)));

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (doc.fileHash && (await isHashRemoved(doc.fileHash))) {
    return NextResponse.json({ error: "File content has been removed" }, { status: 410 });
  }
  if (!doc.filePath) {
    return NextResponse.json(
      { error: "No file is associated with this document" },
      { status: 404 },
    );
  }

  const [updated] = await db
    .update(documentShareLinks)
    .set({ viewCount: sql`${documentShareLinks.viewCount} + 1` })
    .where(
      and(
        eq(documentShareLinks.id, link.id),
        sql`(${documentShareLinks.maxViews} IS NULL OR ${documentShareLinks.viewCount} < ${documentShareLinks.maxViews})`,
      ),
    )
    .returning({ viewCount: documentShareLinks.viewCount });

  if (!updated) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }

  let buffer: Buffer;
  try {
    buffer = await getFile(doc.filePath);
  } catch (error) {
    logError(
      "Failed to read shared document file from storage",
      { path: "/api/share/[token]/download" },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json({ error: "File is currently unavailable" }, { status: 404 });
  }

  const filename = (doc.originalFilename ?? doc.documentNumber).replace(/"/g, "");
  const disposition = requestedAttachment ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(req: NextRequest, context: ShareDownloadContext) {
  try {
    return await serveSharedDocument(req, context);
  } catch (error) {
    if (error instanceof TRPCError && error.code === "TOO_MANY_REQUESTS") {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    logError(
      "Unexpected shared document download failure",
      { path: "/api/share/[token]/download" },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json({ error: "Unable to serve shared document" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: ShareDownloadContext) {
  return GET(req, context);
}
