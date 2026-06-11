"use client";

import { X } from "lucide-react";
import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { UploadFormValues } from "@/lib/validators/documents-form";

const categories = [
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

const agencies = ["CLW", "RDSO", "RCF", "ICF", "DLW", "BLW", "RWF", "MCF"];

interface DocumentMetadataFormProps {
  form: UseFormReturn<UploadFormValues>;
  className?: string;
}

export function DocumentMetadataForm({ form, className }: DocumentMetadataFormProps) {
  const [tagInput, setTagInput] = useState("");
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const tags = watch("tags") || [];

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setValue("tags", [...tags, tag]);
      setTagInput("");
    }
  }, [tagInput, tags, setValue]);

  const removeTag = useCallback(
    (tag: string) => {
      setValue(
        "tags",
        tags.filter((t) => t !== tag),
      );
    },
    [tags, setValue],
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag],
  );

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {/* Document Number */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="documentNumber" className="text-xs font-medium">
          Document Number *
        </Label>
        <Input
          id="documentNumber"
          placeholder="e.g., CLW/ED/TM/4907/GA"
          className="h-8 text-xs"
          {...register("documentNumber")}
        />
        {errors.documentNumber && (
          <span className="text-[10px] text-destructive">{errors.documentNumber.message}</span>
        )}
      </div>

      {/* Title */}
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="title" className="text-xs font-medium">
          Title *
        </Label>
        <Input
          id="title"
          placeholder="Document title"
          className="h-8 text-xs"
          {...register("title")}
        />
        {errors.title && (
          <span className="text-[10px] text-destructive">{errors.title.message}</span>
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Category *</Label>
        <Select
          value={watch("category")}
          onValueChange={(val) => {
            if (val) setValue("category", val as UploadFormValues["category"]);
          }}
        >
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <span className="text-[10px] text-destructive">{errors.category.message}</span>
        )}
      </div>

      {/* Revision */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="revision" className="text-xs font-medium">
          Revision *
        </Label>
        <Input id="revision" placeholder="R0" className="h-8 text-xs" {...register("revision")} />
        {errors.revision && (
          <span className="text-[10px] text-destructive">{errors.revision.message}</span>
        )}
      </div>

      {/* Revision Date */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="revisionDate" className="text-xs font-medium">
          Revision Date
        </Label>
        <Input
          id="revisionDate"
          type="date"
          className="h-8 text-xs"
          {...register("revisionDate")}
        />
      </div>

      {/* Agency */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Agency *</Label>
        <Select
          value={watch("agency")}
          onValueChange={(val) => {
            if (val) setValue("agency", val);
          }}
        >
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Select agency" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.agency && (
          <span className="text-[10px] text-destructive">{errors.agency.message}</span>
        )}
      </div>

      {/* Tags */}
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Tags</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="h-8 text-xs flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={addTag}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="notes" className="text-xs font-medium">
          Notes
        </Label>
        <Textarea
          id="notes"
          placeholder="Additional notes or comments"
          className="text-xs min-h-[60px]"
          {...register("notes")}
        />
      </div>
    </div>
  );
}
