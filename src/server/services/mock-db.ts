/**
 * In-memory mock database service.
 * Provides CRUD operations against mock data arrays.
 * This will be swapped for real Drizzle ORM queries when PostgreSQL is connected.
 */

import { MOCK_DOCUMENTS, type MockDocument } from "@/lib/mock-data/documents";
import { MOCK_PL_NUMBERS, type MockPlNumber } from "@/lib/mock-data/pl-numbers";

// In-memory stores (mutable copies of mock data)
let documents: MockDocument[] = [...MOCK_DOCUMENTS];
let plNumbers: MockPlNumber[] = [...MOCK_PL_NUMBERS];

// --- Generic helpers ---

interface PaginationParams {
  limit: number;
  offset: number;
}

interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

function paginate<T>(items: T[], params: PaginationParams): { data: T[]; total: number } {
  const total = items.length;
  const data = items.slice(params.offset, params.offset + params.limit);
  return { data, total };
}

function sortItems<T>(items: T[], params: SortParams): T[] {
  return [...items].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[params.sortBy];
    const bVal = (b as Record<string, unknown>)[params.sortBy];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const comparison = String(aVal).localeCompare(String(bVal));
    return params.sortOrder === "desc" ? -comparison : comparison;
  });
}

function searchFilter<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  const lower = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      if (typeof val === "string") return val.toLowerCase().includes(lower);
      if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(lower));
      return false;
    }),
  );
}

// --- Documents ---

export interface DocumentListParams extends PaginationParams, SortParams {
  search?: string;
  category?: string;
  status?: string;
  ocrStatus?: string;
  fileType?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function listDocuments(params: DocumentListParams) {
  let filtered = [...documents];

  if (params.search) {
    filtered = searchFilter(filtered, params.search, ["documentNumber", "title", "tags"]);
  }
  if (params.category) {
    filtered = filtered.filter((d) => d.category === params.category);
  }
  if (params.status) {
    filtered = filtered.filter((d) => d.status === params.status);
  }
  if (params.ocrStatus) {
    filtered = filtered.filter((d) => d.ocrStatus === params.ocrStatus);
  }
  if (params.fileType) {
    filtered = filtered.filter((d) => d.fileType === params.fileType);
  }
  if (params.ownerId) {
    filtered = filtered.filter((d) => d.ownerId === params.ownerId);
  }

  const sorted = sortItems(filtered, params);
  return paginate(sorted, params);
}

export function getDocumentById(id: string): MockDocument | undefined {
  return documents.find((d) => d.id === id);
}

export function createDocument(
  doc: Omit<MockDocument, "id" | "createdAt" | "updatedAt">,
): MockDocument {
  const newDoc: MockDocument = {
    ...doc,
    id: `doc-${String(documents.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  documents.push(newDoc);
  return newDoc;
}

export function updateDocument(
  id: string,
  updates: Partial<MockDocument>,
): MockDocument | undefined {
  const index = documents.findIndex((d) => d.id === id);
  if (index === -1) return undefined;
  documents[index] = { ...documents[index], ...updates, updatedAt: new Date().toISOString() };
  return documents[index];
}

export function deleteDocument(id: string): boolean {
  const index = documents.findIndex((d) => d.id === id);
  if (index === -1) return false;
  documents.splice(index, 1);
  return true;
}

export function linkDocumentToPl(documentId: string, plId: string): boolean {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) return false;
  if (!doc.linkedPlIds.includes(plId)) {
    doc.linkedPlIds.push(plId);
    doc.updatedAt = new Date().toISOString();
  }
  return true;
}

export function unlinkDocumentFromPl(documentId: string, plId: string): boolean {
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) return false;
  doc.linkedPlIds = doc.linkedPlIds.filter((id) => id !== plId);
  doc.updatedAt = new Date().toISOString();
  return true;
}

export function getDocumentsByPlId(plId: string): MockDocument[] {
  return documents.filter((d) => d.linkedPlIds.includes(plId));
}

export function getExistingHashes(): Array<{ id: string; fileHash: string | null }> {
  return documents.map((d) => ({ id: d.id, fileHash: d.fileHash }));
}

// --- PL Numbers ---

export interface PlListParams extends PaginationParams, SortParams {
  search?: string;
  category?: string;
  status?: string;
  safetyCritical?: boolean;
  workshop?: string;
}

export function listPlNumbers(params: PlListParams) {
  let filtered = [...plNumbers];

  if (params.search) {
    filtered = searchFilter(filtered, params.search, ["plNumber", "name", "description"]);
  }
  if (params.category) {
    filtered = filtered.filter((p) => p.category === params.category);
  }
  if (params.status) {
    filtered = filtered.filter((p) => p.status === params.status);
  }
  if (params.safetyCritical !== undefined) {
    filtered = filtered.filter((p) => p.safetyCritical === params.safetyCritical);
  }
  if (params.workshop) {
    filtered = filtered.filter((p) => p.workshop === params.workshop);
  }

  const sorted = sortItems(filtered, params);
  return paginate(sorted, params);
}

export function getPlById(id: string): MockPlNumber | undefined {
  return plNumbers.find((p) => p.id === id);
}

export function getPlByNumber(plNumber: string): MockPlNumber | undefined {
  return plNumbers.find((p) => p.plNumber === plNumber);
}

export function createPl(pl: Omit<MockPlNumber, "id" | "createdAt" | "updatedAt">): MockPlNumber {
  const newPl: MockPlNumber = {
    ...pl,
    id: `pl-${String(plNumbers.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  plNumbers.push(newPl);
  return newPl;
}

export function updatePl(id: string, updates: Partial<MockPlNumber>): MockPlNumber | undefined {
  const index = plNumbers.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  plNumbers[index] = { ...plNumbers[index], ...updates, updatedAt: new Date().toISOString() };
  return plNumbers[index];
}

export function searchPl(query: string, limit = 10): MockPlNumber[] {
  const lower = query.toLowerCase();
  return plNumbers
    .filter(
      (p) =>
        p.plNumber.includes(lower) ||
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower),
    )
    .slice(0, limit);
}

// --- Reset (for testing) ---

export function resetMockData() {
  documents = [...MOCK_DOCUMENTS];
  plNumbers = [...MOCK_PL_NUMBERS];
}
