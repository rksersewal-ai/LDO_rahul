import { and, eq, inArray, sql } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { db } from "@/lib/db";
import { documentLegalHolds, documents, legalHolds } from "@/lib/db/schema";

describe("Bulk Query building for Governance removedHashes", () => {
  test("build bulk queries correctly without N+1", async () => {
    const hashes = ["hash1", "hash2", "hash3"];

    const query1 = db
      .select({
        fileHash: documents.fileHash,
        count: sql<number>`count(*)::int`,
      })
      .from(documents)
      .where(and(inArray(documents.fileHash, hashes), eq(documents.isDeleted, 0)))
      .groupBy(documents.fileHash)
      .toSQL();

    expect(query1.sql).toContain("group by");
    expect(query1.sql).toContain("in");
    expect(query1.params).toEqual(["hash1", "hash2", "hash3", 0]);

    const query2 = db
      .select({
        fileHash: documents.fileHash,
      })
      .from(documentLegalHolds)
      .innerJoin(documents, eq(documents.id, documentLegalHolds.documentId))
      .innerJoin(legalHolds, eq(legalHolds.id, documentLegalHolds.holdId))
      .where(and(inArray(documents.fileHash, hashes), eq(legalHolds.status, "active")))
      .groupBy(documents.fileHash)
      .toSQL();

    expect(query2.sql).toContain("group by");
    expect(query2.sql).toContain("in");
    expect(query2.params).toEqual(["hash1", "hash2", "hash3", "active"]);
  });
});
