import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";
import { MOCK_PL_NUMBERS } from "@/lib/mock-data/pl-numbers";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data/work-records";
import type { SearchFacets, SearchResult, SearchSuggestion } from "@/lib/validators/search";
import {
  documentSearchSchema,
  facetRequestSchema,
  globalSearchSchema,
  suggestSchema,
} from "@/lib/validators/search";
import { protectedProcedure, router } from "@/server/trpc";

function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

function getMatchText(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 80);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 40);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function searchDocuments(query: string): SearchResult[] {
  return MOCK_DOCUMENTS.filter(
    (doc) =>
      matchesQuery(doc.title, query) ||
      matchesQuery(doc.documentNumber, query) ||
      matchesQuery(doc.ocrText, query) ||
      doc.tags.some((t) => matchesQuery(t, query)),
  ).map((doc) => ({
    id: doc.id,
    type: "document" as const,
    title: `${doc.documentNumber} - ${doc.title}`,
    subtitle: `${doc.category} | Rev ${doc.revision} | ${doc.agency}`,
    matchText: getMatchText(
      matchesQuery(doc.title, query)
        ? doc.title
        : matchesQuery(doc.documentNumber, query)
          ? doc.documentNumber
          : doc.ocrText || doc.title,
      query,
    ),
    badges: [doc.category, doc.status],
    url: `/documents/${doc.id}`,
    createdAt: doc.createdAt,
  }));
}

function searchPlNumbers(query: string): SearchResult[] {
  return MOCK_PL_NUMBERS.filter(
    (pl) =>
      matchesQuery(pl.plNumber, query) ||
      matchesQuery(pl.name, query) ||
      matchesQuery(pl.description, query),
  ).map((pl) => ({
    id: pl.id,
    type: "pl" as const,
    title: `${pl.plNumber} - ${pl.name}`,
    subtitle: `${pl.category} | ${pl.workshop}`,
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
    createdAt: pl.createdAt,
  }));
}

function searchWorkRecords(query: string): SearchResult[] {
  return MOCK_WORK_RECORDS.filter(
    (wr) =>
      matchesQuery(wr.description, query) ||
      matchesQuery(wr.referenceNumber, query) ||
      matchesQuery(wr.workTypeLabel, query) ||
      matchesQuery(wr.plNumber, query),
  ).map((wr) => ({
    id: wr.id,
    type: "work_record" as const,
    title: `${wr.referenceNumber} - ${wr.workTypeLabel}`,
    subtitle: `${wr.workCategory} | ${wr.userName} | ${wr.date}`,
    matchText: getMatchText(
      matchesQuery(wr.description, query) ? wr.description : wr.referenceNumber,
      query,
    ),
    badges: [wr.status, wr.priority],
    url: `/ledger?id=${wr.id}`,
    createdAt: wr.createdAt,
  }));
}

export const searchRouter = router({
  global: protectedProcedure.input(globalSearchSchema).query(({ input }) => {
    const { query, entityType, limit, offset, sortBy, sortOrder, filters } = input;
    let results: SearchResult[] = [];

    if (entityType === "all" || entityType === "document") {
      results = [...results, ...searchDocuments(query)];
    }
    if (entityType === "all" || entityType === "pl") {
      results = [...results, ...searchPlNumbers(query)];
    }
    if (entityType === "all" || entityType === "work_record") {
      results = [...results, ...searchWorkRecords(query)];
    }

    // Apply filters
    if (filters?.category) {
      results = results.filter((r) =>
        r.badges.some((b) => b.toLowerCase() === filters.category?.toLowerCase()),
      );
    }
    if (filters?.status) {
      results = results.filter((r) =>
        r.badges.some((b) => b.toLowerCase() === filters.status?.toLowerCase()),
      );
    }

    // Sort
    if (sortBy === "date") {
      results.sort((a, b) => {
        const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? -cmp : cmp;
      });
    } else if (sortBy === "name") {
      results.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title);
        return sortOrder === "desc" ? -cmp : cmp;
      });
    }
    // relevance: keep default order (match quality)

    const total = results.length;
    const data = results.slice(offset, offset + limit);

    return { data, total };
  }),

  documents: protectedProcedure.input(documentSearchSchema).query(({ input }) => {
    const { query, category, status, ocrStatus, limit, offset } = input;

    let results = MOCK_DOCUMENTS.filter(
      (doc) =>
        matchesQuery(doc.title, query) ||
        matchesQuery(doc.documentNumber, query) ||
        matchesQuery(doc.ocrText, query) ||
        doc.tags.some((t) => matchesQuery(t, query)),
    );

    if (category) {
      results = results.filter((d) => d.category === category);
    }
    if (status) {
      results = results.filter((d) => d.status === status);
    }
    if (ocrStatus) {
      results = results.filter((d) => d.ocrStatus === ocrStatus);
    }

    const total = results.length;
    const data = results.slice(offset, offset + limit);

    return { data, total };
  }),

  facets: protectedProcedure.input(facetRequestSchema).query(({ input }) => {
    const { query, entityType } = input;

    const categoryCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    const entityTypeCount: Record<string, number> = {};

    // Documents
    if (entityType === "all" || entityType === "document") {
      const docs = MOCK_DOCUMENTS.filter(
        (doc) =>
          matchesQuery(doc.title, query) ||
          matchesQuery(doc.documentNumber, query) ||
          matchesQuery(doc.ocrText, query) ||
          doc.tags.some((t) => matchesQuery(t, query)),
      );
      for (const doc of docs) {
        categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
        statusCount[doc.status] = (statusCount[doc.status] || 0) + 1;
      }
      if (docs.length > 0) {
        entityTypeCount.document = docs.length;
      }
    }

    // PL Numbers
    if (entityType === "all" || entityType === "pl") {
      const pls = MOCK_PL_NUMBERS.filter(
        (pl) =>
          matchesQuery(pl.plNumber, query) ||
          matchesQuery(pl.name, query) ||
          matchesQuery(pl.description, query),
      );
      for (const pl of pls) {
        categoryCount[pl.category] = (categoryCount[pl.category] || 0) + 1;
        statusCount[pl.status] = (statusCount[pl.status] || 0) + 1;
      }
      if (pls.length > 0) {
        entityTypeCount.pl = pls.length;
      }
    }

    // Work Records
    if (entityType === "all" || entityType === "work_record") {
      const wrs = MOCK_WORK_RECORDS.filter(
        (wr) =>
          matchesQuery(wr.description, query) ||
          matchesQuery(wr.referenceNumber, query) ||
          matchesQuery(wr.workTypeLabel, query) ||
          matchesQuery(wr.plNumber, query),
      );
      for (const wr of wrs) {
        categoryCount[wr.workCategory] = (categoryCount[wr.workCategory] || 0) + 1;
        statusCount[wr.status] = (statusCount[wr.status] || 0) + 1;
      }
      if (wrs.length > 0) {
        entityTypeCount.work_record = wrs.length;
      }
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
      entityTypes: Object.entries(entityTypeCount).map(([value, count]) => ({
        label:
          value === "document"
            ? "Documents"
            : value === "pl"
              ? "PL Numbers"
              : value === "work_record"
                ? "Work Records"
                : "Cases",
        value,
        count,
      })),
    };

    return facets;
  }),

  suggest: protectedProcedure.input(suggestSchema).query(({ input }) => {
    const { query, limit } = input;
    const suggestions: SearchSuggestion[] = [];

    // Documents
    for (const doc of MOCK_DOCUMENTS) {
      if (
        matchesQuery(doc.title, query) ||
        matchesQuery(doc.documentNumber, query) ||
        doc.tags.some((t) => matchesQuery(t, query))
      ) {
        suggestions.push({
          id: doc.id,
          type: "document",
          title: doc.documentNumber,
          subtitle: doc.title,
          url: `/documents/${doc.id}`,
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    // PL Numbers
    for (const pl of MOCK_PL_NUMBERS) {
      if (
        matchesQuery(pl.plNumber, query) ||
        matchesQuery(pl.name, query) ||
        matchesQuery(pl.description, query)
      ) {
        suggestions.push({
          id: pl.id,
          type: "pl",
          title: pl.plNumber,
          subtitle: pl.name,
          url: `/pl/${pl.id}`,
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    // Work Records
    for (const wr of MOCK_WORK_RECORDS) {
      if (
        matchesQuery(wr.description, query) ||
        matchesQuery(wr.referenceNumber, query) ||
        matchesQuery(wr.workTypeLabel, query)
      ) {
        suggestions.push({
          id: wr.id,
          type: "work_record",
          title: wr.referenceNumber,
          subtitle: wr.workTypeLabel,
          url: `/ledger?id=${wr.id}`,
        });
      }
      if (suggestions.length >= limit) return suggestions;
    }

    return suggestions.slice(0, limit);
  }),
});
