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

export interface PlFilterState {
  search: string;
  category: string;
  status: string;
  workshop: string;
  safetyOnly: boolean;
}

interface PlFiltersProps {
  filters: PlFilterState;
  onFiltersChange: (filters: PlFilterState) => void;
  className?: string;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "CAT-A", label: "CAT-A" },
  { value: "CAT-B", label: "CAT-B" },
  { value: "CAT-C", label: "CAT-C" },
  { value: "CAT-D", label: "CAT-D" },
];

const statuses = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deprecated", label: "Deprecated" },
  { value: "under_review", label: "Under Review" },
];

const workshops = [
  { value: "", label: "All Workshops" },
  { value: "CLW Chittaranjan", label: "CLW Chittaranjan" },
  { value: "RWF Bangalore", label: "RWF Bangalore" },
];

export function PlFilters({ filters, onFiltersChange, className }: PlFiltersProps) {
  const activeFilterCount = [
    filters.category,
    filters.status,
    filters.workshop,
    filters.safetyOnly ? "safety" : "",
  ].filter(Boolean).length;

  function updateFilter(key: keyof PlFilterState, value: string | boolean | null) {
    onFiltersChange({ ...filters, [key]: value ?? "" });
  }

  function clearFilters() {
    onFiltersChange({
      search: filters.search,
      category: "",
      status: "",
      workshop: "",
      safetyOnly: false,
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        placeholder="Search PL numbers..."
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="h-7 w-[200px] text-xs"
      />

      <Select value={filters.category} onValueChange={(val) => updateFilter("category", val)}>
        <SelectTrigger size="sm" className="w-[130px] text-xs">
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

      <Select value={filters.workshop} onValueChange={(val) => updateFilter("workshop", val)}>
        <SelectTrigger size="sm" className="w-[150px] text-xs">
          <SelectValue placeholder="Workshop" />
        </SelectTrigger>
        <SelectContent>
          {workshops.map((w) => (
            <SelectItem key={w.value} value={w.value}>
              {w.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={filters.safetyOnly ? "default" : "outline"}
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => updateFilter("safetyOnly", !filters.safetyOnly)}
      >
        <Filter className="h-3 w-3" />
        Safety Only
      </Button>

      {activeFilterCount > 0 && (
        <>
          <Badge variant="secondary" className="text-[10px]">
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
