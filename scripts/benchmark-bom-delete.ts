import { db } from "@/lib/db";
import { bomProducts, bomEntries } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { bomRouter } from "@/server/routers/bom";
import { eq, inArray } from "drizzle-orm";

async function runBenchmark() {
  console.log("Setting up benchmark data...");
  const workspaceId = "benchmark-ws-" + nanoid();
  const userId = "benchmark-user-" + nanoid();

  const productId = nanoid();
  await db.insert(bomProducts).values({
    id: productId,
    productCode: "BENCHMARK-" + nanoid(),
    name: "Benchmark Product",
    workspaceId,
    createdBy: userId,
    approvalStatus: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const rootEntryId = nanoid();
  await db.insert(bomEntries).values({
    id: rootEntryId,
    bomProductId: productId,
    parentId: null,
    itemNumber: 1,
    partName: "Root Entry",
    position: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create a lot of children
  const numChildren = 50;
  const childEntries = [];
  for (let i = 0; i < numChildren; i++) {
    childEntries.push({
      id: nanoid(),
      bomProductId: productId,
      parentId: rootEntryId,
      itemNumber: i + 2,
      partName: `Child ${i}`,
      position: i,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Insert children in chunks
  for (let i = 0; i < childEntries.length; i += 50) {
    await db.insert(bomEntries).values(childEntries.slice(i, i + 50));
  }

  // Also create grandchildren
  const numGrandChildren = 5;
  const grandChildren = [];
  for (let i = 0; i < childEntries.length; i++) {
    for (let j = 0; j < numGrandChildren; j++) {
      grandChildren.push({
        id: nanoid(),
        bomProductId: productId,
        parentId: childEntries[i].id,
        itemNumber: j + 1,
        partName: `Grandchild ${i}-${j}`,
        position: j,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  for (let i = 0; i < grandChildren.length; i += 50) {
    await db.insert(bomEntries).values(grandChildren.slice(i, i + 50));
  }

  console.log(`Created ${1 + numChildren + grandChildren.length} entries. Ready to measure deletion.`);

  const caller = bomRouter.createCaller({
    session: { user: { id: userId, name: "Bench", workspaceId } }
  } as any);

  console.log("Measuring deletion time...");
  const start = performance.now();
  await caller.removeEntry({ entryId: rootEntryId });
  const end = performance.now();

  console.log(`Deletion took: ${(end - start).toFixed(2)} ms`);

  // Cleanup
  await db.delete(bomProducts).where(eq(bomProducts.id, productId));
  console.log("Cleanup done.");
  process.exit(0);
}

runBenchmark().catch(console.error);
