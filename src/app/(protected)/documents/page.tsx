"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type DocumentFilterState, DocumentFilters } from "@/components/documents/document-filters";
import { DocumentGrid } from "@/components/documents/document-grid";
import { DocumentTable } from "@/components/documents/document-table";
import { type ViewMode, ViewToggle } from "@/components/documents/view-toggle";
import { PageFrame } from "@/components/layout/page-frame";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";

const VIEW_MODE_KEY = "doc-hub-view-mode";

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  if (stored === "grid" || stored === "list") return stored;
  return "list";
}

export default function DocumentHubPage() {
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [filters, setFilters] = useState<DocumentFilterState>({
    search: "",
    category: "",
    status: "",
    ocrStatus: "",
    fileType: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // Apply filters to mock data client-side for now
  const filteredData = MOCK_DOCUMENTS.filter((doc) => {
    if (
      filters.search &&
      !doc.documentNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
      !doc.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !doc.tags.some((t) => t.toLowerCase().includes(filters.search.toLowerCase()))
    ) {
      return false;
    }
    if (filters.category && doc.category !== filters.category) return false;
    if (filters.status && doc.status !== filters.status) return false;
    if (filters.ocrStatus && doc.ocrStatus !== filters.ocrStatus) return false;
    if (filters.fileType && doc.fileType !== filters.fileType) return false;
    if (filters.dateFrom && doc.updatedAt < filters.dateFrom) return false;
    if (filters.dateTo && doc.updatedAt > filters.dateTo) return false;
    return true;
  });

  const exportHeaders = [
    "Document Number",
    "Title",
    "Category",
    "Status",
    "Revision",
    "File Type",
    "OCR Status",
    "OCR Confidence",
    "Updated",
  ];

  const exportRows = useMemo(
    () =>
      filteredData.map((doc) => [
        doc.documentNumber,
        doc.title,
        doc.category,
        doc.status,
        doc.revision,
        doc.fileType,
        doc.ocrStatus,
        doc.ocrConfidence ? `${doc.ocrConfidence}%` : "",
        doc.updatedAt,
      ]),
    [filteredData],
  );

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Document Hub"
          subtitle="Centralized document repository with OCR intelligence"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <ExportDropdown
                title="Document Hub"
                headers={exportHeaders}
                rows={exportRows}
                filenamePrefix="documents"
              />
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                render={<Link href="/documents/upload" />}
              >
                <Plus className="h-3 w-3" />
                Upload Document
              </Button>
            </div>
          }
        />

        {/* Filters toolbar */}
        <DocumentFilters filters={filters} onFiltersChange={setFilters} />

        {/* Results info + View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredData.length} of {MOCK_DOCUMENTS.length} documents
          </p>
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Data Table or Grid */}
        {viewMode === "list" ? (
          <DocumentTable data={filteredData} />
        ) : (
          <DocumentGrid data={filteredData} />
        )}
      </div>
    </PageFrame>
  );
}
