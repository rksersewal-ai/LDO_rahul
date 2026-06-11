"use client";

import { Download, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type DocumentFilterState, DocumentFilters } from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";

export default function DocumentHubPage() {
  const [filters, setFilters] = useState<DocumentFilterState>({
    search: "",
    category: "",
    status: "",
    ocrStatus: "",
    fileType: "",
    dateFrom: "",
    dateTo: "",
  });

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
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" />
                Export
              </Button>
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

        {/* Results info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredData.length} of {MOCK_DOCUMENTS.length} documents
          </p>
        </div>

        {/* Data Table */}
        <DocumentTable data={filteredData} />
      </div>
    </PageFrame>
  );
}
