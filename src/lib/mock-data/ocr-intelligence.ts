/**
 * Mock OCR Intelligence Data
 * Approved assertions grouped by field_key and extracted entities grouped by entity_type.
 * Used in the Document Preview side panel for OCR intelligence display.
 */

export interface OcrAssertion {
  id: string;
  documentId: string;
  fieldKey: string;
  value: string;
  normalizedValue: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  confidence: number;
  source: "ocr_extraction" | "manual" | "rule_engine";
  createdAt: string;
  updatedAt: string;
}

export interface OcrEntity {
  id: string;
  documentId: string;
  entityType: string;
  entityValue: string;
  normalizedValue: string;
  confidence: number;
  reviewStatus: "APPROVED" | "PENDING" | "REJECTED";
  sourceEngine: string;
  pageNumber: number;
  createdAt: string;
}

export const MOCK_OCR_ASSERTIONS: OcrAssertion[] = [
  {
    id: "assert-001",
    documentId: "doc-001",
    fieldKey: "document_number",
    value: "CLW/ED/TM/4907/GA",
    normalizedValue: "CLW/ED/TM/4907/GA",
    status: "APPROVED",
    confidence: 97,
    source: "ocr_extraction",
    createdAt: "2024-06-15T12:00:00Z",
    updatedAt: "2024-06-16T09:00:00Z",
  },
  {
    id: "assert-002",
    documentId: "doc-001",
    fieldKey: "drawing_number",
    value: "TM-4907-GA-R3",
    normalizedValue: "TM-4907-GA-R3",
    status: "APPROVED",
    confidence: 94,
    source: "ocr_extraction",
    createdAt: "2024-06-15T12:00:00Z",
    updatedAt: "2024-06-16T09:00:00Z",
  },
  {
    id: "assert-003",
    documentId: "doc-001",
    fieldKey: "pl_number",
    value: "10230101",
    normalizedValue: "10230101",
    status: "APPROVED",
    confidence: 92,
    source: "rule_engine",
    createdAt: "2024-06-15T12:05:00Z",
    updatedAt: "2024-06-16T09:10:00Z",
  },
  {
    id: "assert-004",
    documentId: "doc-001",
    fieldKey: "vendor_reference",
    value: "BHEL/TM/2024/REF-001",
    normalizedValue: "BHEL/TM/2024/REF-001",
    status: "APPROVED",
    confidence: 88,
    source: "ocr_extraction",
    createdAt: "2024-06-15T12:10:00Z",
    updatedAt: "2024-06-17T10:00:00Z",
  },
  {
    id: "assert-005",
    documentId: "doc-002",
    fieldKey: "document_number",
    value: "CLW/ED/TM/4907/ARM",
    normalizedValue: "CLW/ED/TM/4907/ARM",
    status: "APPROVED",
    confidence: 96,
    source: "ocr_extraction",
    createdAt: "2024-05-10T11:00:00Z",
    updatedAt: "2024-05-11T08:00:00Z",
  },
  {
    id: "assert-006",
    documentId: "doc-002",
    fieldKey: "drawing_number",
    value: "ARM-4907-DET-R2",
    normalizedValue: "ARM-4907-DET-R2",
    status: "APPROVED",
    confidence: 91,
    source: "ocr_extraction",
    createdAt: "2024-05-10T11:00:00Z",
    updatedAt: "2024-05-11T08:00:00Z",
  },
  {
    id: "assert-007",
    documentId: "doc-002",
    fieldKey: "pl_number",
    value: "10230201",
    normalizedValue: "10230201",
    status: "APPROVED",
    confidence: 93,
    source: "rule_engine",
    createdAt: "2024-05-10T11:05:00Z",
    updatedAt: "2024-05-11T08:05:00Z",
  },
  {
    id: "assert-008",
    documentId: "doc-003",
    fieldKey: "document_number",
    value: "CLW/MD/BF/WAP7/GA",
    normalizedValue: "CLW/MD/BF/WAP7/GA",
    status: "APPROVED",
    confidence: 95,
    source: "ocr_extraction",
    createdAt: "2024-08-20T10:00:00Z",
    updatedAt: "2024-08-21T09:00:00Z",
  },
];

export const MOCK_OCR_ENTITIES: OcrEntity[] = [
  {
    id: "entity-001",
    documentId: "doc-001",
    entityType: "PART_NUMBER",
    entityValue: "TM-4907",
    normalizedValue: "TM-4907",
    confidence: 96,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 1,
    createdAt: "2024-06-15T12:00:00Z",
  },
  {
    id: "entity-002",
    documentId: "doc-001",
    entityType: "DIMENSION",
    entityValue: "1250 x 840 x 920 mm",
    normalizedValue: "1250x840x920mm",
    confidence: 89,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 1,
    createdAt: "2024-06-15T12:01:00Z",
  },
  {
    id: "entity-003",
    documentId: "doc-001",
    entityType: "MATERIAL",
    entityValue: "IS 2062 Grade E250",
    normalizedValue: "IS2062-E250",
    confidence: 91,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 2,
    createdAt: "2024-06-15T12:02:00Z",
  },
  {
    id: "entity-004",
    documentId: "doc-001",
    entityType: "SPECIFICATION",
    entityValue: "IRS:E.10-3-2019",
    normalizedValue: "IRS:E.10-3-2019",
    confidence: 94,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 1,
    createdAt: "2024-06-15T12:03:00Z",
  },
  {
    id: "entity-005",
    documentId: "doc-001",
    entityType: "PART_NUMBER",
    entityValue: "WAP-7/TM/BEARING-001",
    normalizedValue: "WAP-7/TM/BEARING-001",
    confidence: 87,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 2,
    createdAt: "2024-06-15T12:04:00Z",
  },
  {
    id: "entity-006",
    documentId: "doc-001",
    entityType: "DIMENSION",
    entityValue: "850 kW continuous",
    normalizedValue: "850kW",
    confidence: 93,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 1,
    createdAt: "2024-06-15T12:05:00Z",
  },
  {
    id: "entity-007",
    documentId: "doc-002",
    entityType: "PART_NUMBER",
    entityValue: "ARM-4907-COMPLETE",
    normalizedValue: "ARM-4907-COMPLETE",
    confidence: 95,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 1,
    createdAt: "2024-05-10T11:00:00Z",
  },
  {
    id: "entity-008",
    documentId: "doc-002",
    entityType: "MATERIAL",
    entityValue: "Copper Class F Insulation",
    normalizedValue: "COPPER-CLASS-F",
    confidence: 88,
    reviewStatus: "APPROVED",
    sourceEngine: "tesseract-v5",
    pageNumber: 3,
    createdAt: "2024-05-10T11:02:00Z",
  },
];

/**
 * Helper to get assertions for a specific document
 */
export function getAssertionsForDocument(documentId: string): OcrAssertion[] {
  return MOCK_OCR_ASSERTIONS.filter((a) => a.documentId === documentId);
}

/**
 * Helper to get entities for a specific document
 */
export function getEntitiesForDocument(documentId: string): OcrEntity[] {
  return MOCK_OCR_ENTITIES.filter((e) => e.documentId === documentId);
}

/**
 * Group approved assertions by field key
 */
export function groupAssertionsByField(assertions: OcrAssertion[]): Record<string, OcrAssertion[]> {
  return assertions
    .filter((a) => a.status === "APPROVED")
    .reduce<Record<string, OcrAssertion[]>>((acc, assertion) => {
      const key = assertion.fieldKey;
      if (!acc[key]) acc[key] = [];
      acc[key].push(assertion);
      return acc;
    }, {});
}

/**
 * Group entities by entity type
 */
export function groupEntitiesByType(entities: OcrEntity[]): Record<string, OcrEntity[]> {
  return entities
    .filter((e) => e.reviewStatus !== "REJECTED")
    .reduce<Record<string, OcrEntity[]>>((acc, entity) => {
      const key = entity.entityType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entity);
      return acc;
    }, {});
}
