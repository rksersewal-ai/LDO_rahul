"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type DocumentFilterState, DocumentFilters } from "@/components/documents/document-filters";
import { DocumentGrid } from "@/components/documents/document-grid";
import { DocumentTable } from "@/components/documents/document-table";
import { type ViewMode, ViewToggle } from "@/components/documents/view-toggle";
import { VirtualDocumentList } from "@/components/documents/virtual-document-list";
import { PageFrame } from "@/components/layout/page-frame";
import { EmptyStateFallback } from "@/components/shared/empty-state-fallback";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { useSavedFilters } from "@/hooks/use-saved-filters";
import type { MockDocument } from "@/lib/mock-data/documents";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const VIEW_MODE_KEY = "doc-hub-view-mode";

export default function DocumentHubPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const bulkUploadEnabled = useFeatureFlag("bulk_upload");

  // Hydration-safe: read localStorage only on client after first render
  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);

  const [filters, setFilters] = useState<DocumentFilterState>({
    search: "",
    category: "",
    status: "",
    ocrStatus: "",
    fileType: "",
    dateFrom: "",
    dateTo: "",
  });

  const {
    filters: savedFilterPresets,
    save: saveFilter,
    remove: removeFilter,
  } = useSavedFilters("documents");

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  // Build query input from filters
  const queryInput = useMemo(() => {
    const input: Record<string, unknown> = {
      limit: 100,
      offset: 0,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    };
    if (filters.search) input.search = filters.search;
    if (filters.category) input.category = filters.category;
    if (filters.status) input.status = filters.status;
    if (filters.ocrStatus) input.ocrStatus = filters.ocrStatus;
    if (filters.fileType) input.fileType = filters.fileType;
    if (filters.dateFrom) input.dateFrom = filters.dateFrom;
    if (filters.dateTo) input.dateTo = filters.dateTo;
    return input;
  }, [filters]);

  const {
    data: queryResult,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.documents.list.useQuery(
    queryInput as Parameters<typeof trpc.documents.list.useQuery>[0],
  );

  const filteredData = useMemo(() => {
    if (!queryResult?.data) return [] as MockDocument[];
    // Map DB schema fields to match what DocumentTable/DocumentGrid expect
    return queryResult.data.map((doc) => ({
      id: doc.id,
      documentNumber: doc.documentNumber,
      title: doc.title,
      category: doc.category?.toUpperCase() ?? "OTHER",
      status: doc.status?.toUpperCase() ?? "DRAFT",
      revision: doc.revision ?? "A",
      revisionDate: doc.revisionDate
        ? new Date(doc.revisionDate).toISOString().split("T")[0]
        : null,
      agency: doc.workshop ?? "CLW",
      fileType: doc.mimeType?.split("/").pop() ?? "pdf",
      fileSize: doc.fileSize ?? 0,
      fileHash: doc.fileHash ?? null,
      filePath: doc.filePath ?? null,
      pages: doc.pageCount ?? 1,
      ownerId: doc.createdBy ?? "unknown",
      uploadedBy: doc.createdBy ?? "unknown",
      ocrStatus: doc.ocrStatus?.toUpperCase() ?? "NOT_REQUIRED",
      ocrConfidence: doc.ocrConfidence ?? null,
      ocrText: doc.ocrText ?? null,
      tags: doc.tags
        ? doc.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      isLatest: true,
      isDuplicate: false,
      linkedPlIds: [] as string[],
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      originalFilename: doc.originalFilename ?? null,
    })) as unknown as MockDocument[];
  }, [queryResult]);

  const totalDocuments = queryResult?.total ?? 0;

  const handleSaveCurrentFilter = () => {
    if (!hasActiveFilters) return;
    const parts: string[] = [];
    if (filters.category) parts.push(filters.category);
    if (filters.status) parts.push(filters.status);
    if (filters.fileType) parts.push(filters.fileType);
    if (filters.search) parts.push(`"${filters.search}"`);
    const label = parts.length > 0 ? parts.join(" + ") : "Custom Filter";
    saveFilter(label, filters as unknown as Record<string, unknown>);
  };

  const handleApplySavedFilter = (filterData: Record<string, unknown>) => {
    setFilters(filterData as unknown as DocumentFilterState);
  };

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

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
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
                Refresh
              </Button>
              <ExportDropdown
                title="Document Hub"
                headers={exportHeaders}
                rows={exportRows}
                filenamePrefix="documents"
              />
              {bulkUploadEnabled && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  render={<Link href="/documents/upload" />}
                >
                  <Plus className="h-3 w-3" />
                  Bulk Upload
                </Button>
              )}
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

        {/* Saved Filter Presets */}
        {(savedFilterPresets.length > 0 || hasActiveFilters) && (
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] gap-1 px-2"
                onClick={handleSaveCurrentFilter}
              >
                <Plus className="h-3 w-3" />
                Save Filter
              </Button>
            )}
            {savedFilterPresets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-0.5">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-[11px] px-2 py-0.5"
                  onClick={() => handleApplySavedFilter(preset.filters)}
                >
                  {preset.label}
                </Badge>
                <button
                  type="button"
                  onClick={() => removeFilter(preset.id)}
                  className="text-muted-foreground hover:text-destructive text-[10px] transition-colors"
                  title="Remove saved filter"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results info + View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading documents..."
              : `Showing ${filteredData.length} of ${totalDocuments} documents`}
          </p>
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && <QueryErrorState error={error} retry={() => refetch()} />}

        {/* Data Table or Grid */}
        {!isLoading &&
          !isError &&
          (filteredData.length === 0 ? (
            <EmptyStateFallback
              title="No documents found"
              description={
                hasActiveFilters
                  ? "No documents match your current filters. Try adjusting your search criteria."
                  : "No documents have been uploaded yet. Upload your first document to get started."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
              onAction={
                hasActiveFilters
                  ? () =>
                      setFilters({
                        search: "",
                        category: "",
                        status: "",
                        ocrStatus: "",
                        fileType: "",
                        dateFrom: "",
                        dateTo: "",
                      })
                  : undefined
              }
            />
          ) : viewMode === "list" ? (
            filteredData.length > 50 ? (
              <VirtualDocumentList
                items={filteredData}
                renderRow={(item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 px-4 py-2 border-b text-sm hover:bg-muted/50"
                  >
                    <span className="w-32 font-mono text-xs truncate">
                      {(item as (typeof filteredData)[0]).documentNumber}
                    </span>
                    <span className="flex-1 truncate">
                      {(item as (typeof filteredData)[0]).title}
                    </span>
                    <span className="w-24 text-xs text-muted-foreground">
                      {(item as (typeof filteredData)[0]).category}
                    </span>
                    <span className="w-20 text-xs">
                      {(item as (typeof filteredData)[0]).status}
                    </span>
                  </div>
                )}
                rowHeight={48}
                containerHeight={600}
              />
            ) : (
              <DocumentTable data={filteredData} />
            )
          ) : (
            <DocumentGrid data={filteredData} />
          ))}
      </div>
    </PageFrame>
  );
}
