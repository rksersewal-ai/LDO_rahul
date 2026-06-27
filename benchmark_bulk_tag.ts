import { db } from "./src/lib/db";
import { documents, documentTags, workspaces, users } from "./src/lib/db/schema";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Setting up benchmark data...");
  const userId = uuid();
  const workspaceId = uuid();
  const tagId = uuid();

  // Insert user, workspace
  await db
    .insert(users)
    .values({ id: userId, email: `${userId}@example.com`, name: "Test" })
    .onConflictDoNothing();
  await db
    .insert(workspaces)
    .values({ id: workspaceId, name: "Test WS", ownerId: userId })
    .onConflictDoNothing();

  const N = 500;
  const docIds = [];

  for (let i = 0; i < N; i++) {
    const docId = uuid();
    docIds.push(docId);
    await db.insert(documents).values({
      id: docId,
      workspaceId: workspaceId,
      title: `Doc ${i}`,
      uploadedBy: userId,
      size: 100,
      mimeType: "text/plain",
      fileHash: uuid(),
    });
  }

  console.log("Starting baseline measurement...");
  const start = performance.now();

  // Simulate the N+1 query loop
  for (const docId of docIds) {
    try {
      await db
        .insert(documentTags)
        .values({
          documentId: docId,
          tagId: tagId,
          taggedBy: userId,
        })
        .onConflictDoNothing();
    } catch (e) {
      console.error(e);
    }
  }

  const end = performance.now();
  console.log(`Baseline time for ${N} documents: ${(end - start).toFixed(2)}ms`);

  // Cleanup
  await db.delete(documentTags).where(eq(documentTags.tagId, tagId));
  process.exit(0);
}

run().catch(console.error);
