import { z } from "zod";

export const entityTypeEnum = z.enum(["all", "document", "pl", "work_record", "case"]);

export const globalSearchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  entityType: entityTypeEnum.default("all"),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["relevance", "date", "name"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  filters: z
    .object({
      category: z.string().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
    .optional(),
});

export const documentSearchSchema = z.object({
  query: z.string().min(2),
  category: z.string().optional(),
  status: z.string().optional(),
  ocrStatus: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export const facetRequestSchema = z.object({
  query: z.string().min(2),
  entityType: entityTypeEnum.default("all"),
});

export const suggestSchema = z.object({
  query: z.string().min(2),
  limit: z.number().min(1).max(10).default(5),
});

export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
export type FacetRequestInput = z.infer<typeof facetRequestSchema>;
export type SuggestInput = z.infer<typeof suggestSchema>;

export type EntityType = z.infer<typeof entityTypeEnum>;

export interface SearchResult {
  id: string;
  type: "document" | "pl" | "work_record" | "case";
  title: string;
  subtitle: string;
  matchText: string;
  badges: string[];
  url: string;
  createdAt: string;
  matchField?: string;
  matchReasons?: string[];
}

export interface SearchFacets {
  categories: Array<{ label: string; value: string; count: number }>;
  statuses: Array<{ label: string; value: string; count: number }>;
  entityTypes: Array<{ label: string; value: string; count: number }>;
}

export interface SearchSuggestion {
  id: string;
  type: "document" | "pl" | "work_record" | "case";
  title: string;
  subtitle: string;
  url: string;
}
