import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "./src/lib/db";
import {
  documents,
  documentTags,
  organizations,
  tags,
  users,
  workspaces,
} from "./src/lib/db/schema";

async function run() {
  const userId = uuid();
  const workspaceId = uuid();
  const tagId = uuid();

  const orgId = uuid();
  await db
    .insert(organizations)
    .values({ id: orgId, name: "Test Org", code: "TST" })
    .onConflictDoNothing();
  await db
    .insert(users)
    .values({
      id: userId,
      username: userId,
      email: `${userId}@example.com`,
      passwordHash: "abc",
      name: "Test",
      designation: "tester",
      department: "qa",
      section: "a",
      employeeId: "123",
      clearanceLevel: "level_1",
    })
    .onConflictDoNothing();
  await db
    .insert(workspaces)
    .values({ id: workspaceId, orgId: orgId, name: "Test WS", code: "TWS" })
    .onConflictDoNothing();
  await db
    .insert(tags)
    .values({ id: tagId, workspaceId: workspaceId, name: "Test Tag", createdBy: userId })
    .onConflictDoNothing();

  const N = 500;
  const docIds = [];

  for (let i = 0; i < N; i++) {
    const docId = uuid();
    docIds.push(docId);
    await db.insert(documents).values({
      id: docId,
      workspaceId: workspaceId,
      documentNumber: `DOC-${uuid()}`,
      title: `Doc ${i}`,
      category: "OTHER",
      fileSize: 100,
      mimeType: "text/plain",
      fileHash: uuid(),
      createdBy: userId,
      updatedBy: userId,
    });
  }

  const start = performance.now();

  try {
    await db
      .insert(documentTags)
      .values(
        docIds.map((docId) => ({
          documentId: docId,
          tagId: tagId,
          taggedBy: userId,
        })),
      )
      .onConflictDoNothing();
  } catch (e) {
    console.error(e);
  }

  const end = performance.now();
  console.log(`Baseline time for ${N} documents: ${(end - start).toFixed(2)}ms`);

  await db.delete(documentTags).where(eq(documentTags.tagId, tagId));
  process.exit(0);
}

run().catch(console.error);
