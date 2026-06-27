import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, plNumbers, workRecords } from "@/lib/db/schema";
import type { SearchFacets, SearchResult, SearchSuggestion } from "@/lib/validators/search";
import {
  documentSearchSchema,
  facetRequestSchema,
  globalSearchSchema,
  suggestSchema,
} from "@/lib/validators/search";
import { protectedProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user: { workspaceId: string | null } } }): string {
  const workspaceId = ctx.session.user.workspaceId;
  if (!workspaceId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No workspace assigned. Contact an administrator.",
    });
  }
  return workspaceId;
}

function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

function getMatchText(text: string | null | undefined, query: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 80);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 40);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function dateToString(value: Date | string | null): string {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function likeQuery(query: string): string {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}

function buildDocumentMatch(query: string) {
  const term = likeQuery(query);
  return or(
    ilike(documents.title, term),
    ilike(documents.documentNumber, term),
    ilike(documents.description, term),
    ilike(documents.ocrText, term),
    ilike(documents.tags, term),
  );
}

function buildPlMatch(query: string) {
  const term = likeQuery(query);
  return or(
    ilike(plNumbers.plNumber, term),
    ilike(plNumbers.name, term),
    ilike(plNumbers.description, term),
    ilike(plNumbers.drawingRef, term),
    ilike(plNumbers.specification, term),
    ilike(plNumbers.manufacturer, term),
    ilike(plNumbers.vendorCode, term),
  );
}

function buildWorkMatch(query: string) {
  const term = likeQuery(query);
  return or(
    ilike(workRecords.title, term),
    ilike(workRecords.workOrderNumber, term),
    ilike(workRecords.description, term),
    ilike(workRecords.locoNumber, term),
    ilike(workRecords.workshop, term),
    ilike(workRecords.section, term),
  );
}

async function searchDocuments(query: string, workspaceId: string): Promise<SearchResult[]> {
  const rows = await db
    .select({
      id: documents.id,
      documentNumber: documents.documentNumber,
      title: documents.title,
      description: documents.description,
      category: documents.category,
      status: documents.status,
      revision: documents.revision,
      agency: documents.workshop,
      ocrText: documents.ocrText,
      tags: documents.tags,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        eq(documents.isDeleted, 0),
        buildDocumentMatch(query),
      ),
    )
    .limit(100);

  return rows.map((doc) => ({
    id: doc.id,
    type: "document" as const,
    title: `${doc.documentNumber} - ${doc.title}`,
    subtitle: `${doc.category} | Rev ${doc.revision}${doc.agency ? ` | ${doc.agency}` : ""}`,
    matchText: getMatchText(
      matchesQuery(doc.title, query)
        ? doc.title
        : matchesQuery(doc.documentNumber, query)
          ? doc.documentNumber
          : matchesQuery(doc.description, query)
            ? doc.description
            : matchesQuery(doc.tags, query)
              ? doc.tags
              : doc.ocrText,
      query,
    ),
    badges: [doc.category, doc.status],
    url: `/documents/${doc.id}`,
    createdAt: dateToString(doc.createdAt),
  }));
}

async function searchPlNumbers(query: string, workspaceId: string): Promise<SearchResult[]> {
  const rows = await db
    .select({
      id: plNumbers.id,
      plNumber: plNumbers.plNumber,
      name: plNumbers.name,
      description: plNumbers.description,
      category: plNumbers.category,
      status: plNumbers.status,
      workshop: plNumbers.workshop,
      safetyCritical: plNumbers.safetyCritical,
      createdAt: plNumbers.createdAt,
    })
    .from(plNumbers)
    .where(and(eq(plNumbers.workspaceId, workspaceId), buildPlMatch(query)))
    .limit(100);

  return rows.map((pl) => ({
    id: pl.id,
    type: "pl" as const,
    title: `${pl.plNumber} - ${pl.name}`,
    subtitle: `${pl.category}${pl.workshop ? ` | ${pl.workshop}` : ""}`,
    matchText: getMatchText(
      matchesQuery(pl.name, query)
        ? pl.name
        : matchesQuery(pl.plNumber, query)
          ? pl.plNumber
          : pl.description,
      query,
    ),
    badges: [pl.category, pl.status, ...(pl.safetyCritical ? ["Safety Critical"] : [])],
    url: `/pl/${pl.id}`,
    createdAt: dateToString(pl.createdAt),
  }));
}

async function searchWorkRecords(query: string, workspaceId: string): Promise<SearchResult[]> {
  const rows = await db
    .select({
      id: workRecords.id,
      workOrderNumber: workRecords.workOrderNumber,
      title: workRecords.title,
      description: workRecords.description,
      status: workRecords.status,
      priority: workRecords.priority,
      workshop: workRecords.workshop,
      createdAt: workRecords.createdAt,
    })
    .from(workRecords)
    .where(and(eq(workRecords.workspaceId, workspaceId), buildWorkMatch(query)))
    .limit(100);

  return rows.map((wr) => ({
    id: wr.id,
    type: "work_record" as const,
    title: `${wr.workOrderNumber} - ${wr.title}`,
    subtitle: `${wr.workshop ?? "Work record"}`,
    matchText: getMatchText(
      matchesQuery(wr.description, query) ? wr.description : wr.workOrderNumber,
      query,
    ),
    badges: [wr.status, wr.priority],
    url: `/ledger?id=${wr.id}`,
    createdAt: dateToString(wr.createdAt),
  }));
}

function applyResultFilters(
  results: SearchResult[],
  filters: { category?: string; status?: string } | undefined,
): SearchResult[] {
  let filtered = results;
  if (filters?.category) {
    filtered = filtered.filter((r) =>
      r.badges.some((b) => b.toLowerCase() === filters.category?.toLowerCase()),
    );
  }
  if (filters?.status) {
    filtered = filtered.filter((r) =>
      r.badges.some((b) => b.toLowerCase() === filters.status?.toLowerCase()),
    );
  }
  return filtered;
}

function sortResults(
  results: SearchResult[],
  sortBy: "relevance" | "date" | "name",
  sortOrder: "asc" | "desc",
): SearchResult[] {
  if (sortBy === "date") {
    return results.sort((a, b) => {
      const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? -cmp : cmp;
    });
  }
  if (sortBy === "name") {
    return results.sort((a, b) => {
      const cmp = a.title.localeCompare(b.title);
      return sortOrder === "desc" ? -cmp : cmp;
    });
  }
  return results;
}

function facetRowsToOptions(rows: Array<{ value: string | null; count: number }>) {
  return rows
    .filter((row): row is { value: string; count: number } => !!row.value)
    .map((row) => ({
      label: row.value.replace(/_/g, " "),
      value: row.value,
      count: Number(row.count),
    }));
}

export const searchRouter = router({
  global: protectedProcedure.input(globalSearchSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const { query, entityType, limit, offset, sortBy, sortOrder, filters } = input;
    let results: SearchResult[] = [];

    if (entityType === "all" || entityType === "document") {
      results = [...results, ...(await searchDocuments(query, workspaceId))];
    }
    if (entityType === "all" || entityType === "pl") {
      results = [...results, ...(await searchPlNumbers(query, workspaceId))];
    }
    if (entityType === "all" || entityType === "work_record") {
      results = [...results, ...(await searchWorkRecords(query, workspaceId))];
    }

    results = sortResults(applyResultFilters(results, filters), sortBy, sortOrder);

    const total = results.length;
    const data = results.slice(offset, offset + limit);

    return { data, total };
  }),

  documents: protectedProcedure.input(documentSearchSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const conditions = [
      eq(documents.workspaceId, workspaceId),
      eq(documents.isDeleted, 0),
      buildDocumentMatch(input.query),
    ];

    if (input.category) {
      conditions.push(sql`${documents.category}::text = ${input.category}`);
    }
    if (input.status) {
      conditions.push(sql`${documents.status}::text = ${input.status}`);
    }
    if (input.ocrStatus) {
      conditions.push(sql`${documents.ocrStatus}::text = ${input.ocrStatus}`);
    }

    const whereClause = and(...conditions);
    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(documents)
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db.select({ total: count() }).from(documents).where(whereClause),
    ]);

    return { data: rows, total: totals[0]?.total ?? 0 };
  }),

  facets: protectedProcedure.input(facetRequestSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const { query, entityType } = input;
    const categoryCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    const entityTypeCount: Record<string, number> = {};

    if (entityType === "all" || entityType === "document") {
      const whereClause = and(
        eq(documents.workspaceId, workspaceId),
        eq(documents.isDeleted, 0),
        buildDocumentMatch(query),
      );
      const [categories, statuses, total] = await Promise.all([
        db
          .select({ value: sql<string>`${documents.category}::text`, count: count() })
          .from(documents)
          .where(whereClause)
          .groupBy(documents.category),
        db
          .select({ value: sql<string>`${documents.status}::text`, count: count() })
          .from(documents)
          .where(whereClause)
          .groupBy(documents.status),
        db.select({ total: count() }).from(documents).where(whereClause),
      ]);
      for (const row of facetRowsToOptions(categories)) categoryCount[row.value] = row.count;
      for (const row of facetRowsToOptions(statuses)) statusCount[row.value] = row.count;
      entityTypeCount.document = total[0]?.total ?? 0;
    }

    if (entityType === "all" || entityType === "pl") {
      const whereClause = and(eq(plNumbers.workspaceId, workspaceId), buildPlMatch(query));
      const [categories, statuses, total] = await Promise.all([
        db
          .select({ value: sql<string>`${plNumbers.category}::text`, count: count() })
          .from(plNumbers)
          .where(whereClause)
          .groupBy(plNumbers.category),
        db
          .select({ value: sql<string>`${plNumbers.status}::text`, count: count() })
          .from(plNumbers)
          .where(whereClause)
          .groupBy(plNumbers.status),
        db.select({ total: count() }).from(plNumbers).where(whereClause),
      ]);
      for (const row of facetRowsToOptions(categories)) {
        categoryCount[row.value] = (categoryCount[row.value] || 0) + row.count;
      }
      for (const row of facetRowsToOptions(statuses)) {
        statusCount[row.value] = (statusCount[row.value] || 0) + row.count;
      }
      entityTypeCount.pl = total[0]?.total ?? 0;
    }

    if (entityType === "all" || entityType === "work_record") {
      const whereClause = and(eq(workRecords.workspaceId, workspaceId), buildWorkMatch(query));
      const [categories, statuses, total] = await Promise.all([
        db
          .select({ value: workRecords.workshop, count: count() })
          .from(workRecords)
          .where(whereClause)
          .groupBy(workRecords.workshop),
        db
          .select({ value: sql<string>`${workRecords.status}::text`, count: count() })
          .from(workRecords)
          .where(whereClause)
          .groupBy(workRecords.status),
        db.select({ total: count() }).from(workRecords).where(whereClause),
      ]);
      for (const row of facetRowsToOptions(categories)) {
        categoryCount[row.value] = (categoryCount[row.value] || 0) + row.count;
      }
      for (const row of facetRowsToOptions(statuses)) {
        statusCount[row.value] = (statusCount[row.value] || 0) + row.count;
      }
      entityTypeCount.work_record = total[0]?.total ?? 0;
    }

    const facets: SearchFacets = {
      categories: Object.entries(categoryCount).map(([value, count]) => ({
        label: value.replace(/_/g, " "),
        value,
        count,
      })),
      statuses: Object.entries(statusCount).map(([value, count]) => ({
        label: value.replace(/_/g, " "),
        value,
        count,
      })),
      entityTypes: Object.entries(entityTypeCount)
        .filter(([, countValue]) => countValue > 0)
        .map(([value, countValue]) => ({
          label:
            value === "document"
              ? "Documents"
              : value === "pl"
                ? "PL Numbers"
                : value === "work_record"
                  ? "Work Records"
                  : "Cases",
          value,
          count: countValue,
        })),
    };

    return facets;
  }),

  suggest: protectedProcedure.input(suggestSchema).query(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const { query, limit } = input;
    const suggestions: SearchSuggestion[] = [];

    const docRows = await db
      .select({
        id: documents.id,
        documentNumber: documents.documentNumber,
        title: documents.title,
      })
      .from(documents)
      .where(
        and(
          eq(documents.workspaceId, workspaceId),
          eq(documents.isDeleted, 0),
          buildDocumentMatch(query),
        ),
      )
      .orderBy(desc(documents.createdAt))
      .limit(limit);

    for (const doc of docRows) {
      suggestions.push({
        id: doc.id,
        type: "document",
        title: doc.documentNumber,
        subtitle: doc.title,
        url: `/documents/${doc.id}`,
      });
    }

    if (suggestions.length < limit) {
      const plRows = await db
        .select({ id: plNumbers.id, plNumber: plNumbers.plNumber, name: plNumbers.name })
        .from(plNumbers)
        .where(and(eq(plNumbers.workspaceId, workspaceId), buildPlMatch(query)))
        .orderBy(asc(plNumbers.plNumber))
        .limit(limit - suggestions.length);

      for (const pl of plRows) {
        suggestions.push({
          id: pl.id,
          type: "pl",
          title: pl.plNumber,
          subtitle: pl.name,
          url: `/pl/${pl.id}`,
        });
      }
    }

    if (suggestions.length < limit) {
      const workRows = await db
        .select({
          id: workRecords.id,
          workOrderNumber: workRecords.workOrderNumber,
          title: workRecords.title,
        })
        .from(workRecords)
        .where(and(eq(workRecords.workspaceId, workspaceId), buildWorkMatch(query)))
        .orderBy(desc(workRecords.createdAt))
        .limit(limit - suggestions.length);

      for (const wr of workRows) {
        suggestions.push({
          id: wr.id,
          type: "work_record",
          title: wr.workOrderNumber,
          subtitle: wr.title,
          url: `/ledger?id=${wr.id}`,
        });
      }
    }

    return suggestions.slice(0, limit);
  }),
});
