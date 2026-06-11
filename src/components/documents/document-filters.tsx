"use client";

import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DocumentFilterState {
  search: string;
  category: string;
  status: string;
  ocrStatus: string;
  fileType: string;
  dateFrom: string;
  dateTo: string;
}

interface DocumentFiltersProps {
  filters: DocumentFilterState;
  onFiltersChange: (filters: DocumentFilterState) => void;
  className?: string;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "DRAWING", label: "Drawing" },
  { value: "SPECIFICATION", label: "Specification" },
  { value: "ELIGIBILITY_CRITERIA", label: "Eligibility Criteria" },
  { value: "SCOPE_OF_SUPPLY", label: "Scope of Supply" },
  { value: "SMI", label: "SMI" },
  { value: "STANDARD", label: "Standard" },
  { value: "TENDER", label: "Tender" },
  { value: "SDR", label: "SDR" },
  { value: "TEST_REPORT", label: "Test Report" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "PROCEDURE", label: "Procedure" },
  { value: "OTHER", label: "Other" },
];

const statuses = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "OBSOLETE", label: "Obsolete" },
];

const ocrStatuses = [
  { value: "", label: "All OCR" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "FLAGGED", label: "Flagged" },
];

const fileTypes = [
  { value: "", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "tiff", label: "TIFF" },
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
];

export function DocumentFilters({ filters, onFiltersChange, className }: DocumentFiltersProps) {
  const activeFilterCount = [
    filters.category,
    filters.status,
    filters.ocrStatus,
    filters.fileType,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  function updateFilter(key: keyof DocumentFilterState, value: string | null) {
    onFiltersChange({ ...filters, [key]: value ?? "" });
  }

  function clearFilters() {
    onFiltersChange({
      search: filters.search,
      category: "",
      status: "",
      ocrStatus: "",
      fileType: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        placeholder="Search documents..."
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="h-7 w-[200px] text-xs"
      />

      <Select value={filters.category} onValueChange={(val) => updateFilter("category", val)}>
        <SelectTrigger size="sm" className="w-[140px] text-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(val) => updateFilter("status", val)}>
        <SelectTrigger size="sm" className="w-[120px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.ocrStatus} onValueChange={(val) => updateFilter("ocrStatus", val)}>
        <SelectTrigger size="sm" className="w-[120px] text-xs">
          <SelectValue placeholder="OCR" />
        </SelectTrigger>
        <SelectContent>
          {ocrStatuses.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.fileType} onValueChange={(val) => updateFilter("fileType", val)}>
        <SelectTrigger size="sm" className="w-[100px] text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {fileTypes.map((ft) => (
            <SelectItem key={ft.value} value={ft.value}>
              {ft.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => updateFilter("dateFrom", e.target.value)}
        className="h-7 w-[130px] text-xs"
        placeholder="From"
      />

      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => updateFilter("dateTo", e.target.value)}
        className="h-7 w-[130px] text-xs"
        placeholder="To"
      />

      {activeFilterCount > 0 && (
        <>
          <Badge variant="secondary" className="text-[10px]">
            <Filter className="h-2.5 w-2.5 mr-0.5" />
            {activeFilterCount} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
