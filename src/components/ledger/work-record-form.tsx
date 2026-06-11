"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
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
import {
  getWorkTypesByCategory,
  WORK_CATEGORIES,
  type WorkCategoryCode,
} from "@/lib/mock-data/work-categories";
import { cn } from "@/lib/utils";
import { type CreateWorkRecordInput, createWorkRecordSchema } from "@/lib/validators/work-records";

interface WorkRecordFormProps {
  onSubmit: (data: CreateWorkRecordInput) => void;
  isLoading?: boolean;
  className?: string;
}

export function WorkRecordForm({ onSubmit, isLoading, className }: WorkRecordFormProps) {
  const form = useForm<CreateWorkRecordInput>({
    resolver: zodResolver(createWorkRecordSchema) as never,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      workCategory: undefined,
      workTypeCode: "",
      description: "",
      referenceNumber: "",
      plNumber: null,
      drawingNumber: null,
      specificationNumber: null,
      tenderNumber: null,
      remarks: null,
      priority: "MEDIUM",
      concernedOfficer: null,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedCategory = watch("workCategory");

  const filteredTypes = useMemo(() => {
    if (!selectedCategory) return [];
    return getWorkTypesByCategory(selectedCategory as WorkCategoryCode);
  }, [selectedCategory]);

  const selectedTypeCode = watch("workTypeCode");
  const selectedType = useMemo(
    () => filteredTypes.find((t) => t.code === selectedTypeCode),
    [filteredTypes, selectedTypeCode],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs font-medium">
            Date *
          </Label>
          <Input id="date" type="date" {...register("date")} className="h-8 text-xs" />
          {errors.date && <p className="text-[10px] text-destructive">{errors.date.message}</p>}
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <Label htmlFor="priority" className="text-xs font-medium">
            Priority
          </Label>
          <Select
            value={watch("priority")}
            onValueChange={(v) => {
              if (v) setValue("priority", v as CreateWorkRecordInput["priority"]);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Work Category */}
        <div className="space-y-1.5">
          <Label htmlFor="workCategory" className="text-xs font-medium">
            Work Category *
          </Label>
          <Select
            value={watch("workCategory")}
            onValueChange={(v) => {
              if (v) {
                setValue("workCategory", v as CreateWorkRecordInput["workCategory"]);
                setValue("workTypeCode", "");
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {WORK_CATEGORIES.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.workCategory && (
            <p className="text-[10px] text-destructive">{errors.workCategory.message}</p>
          )}
        </div>

        {/* Work Type */}
        <div className="space-y-1.5">
          <Label htmlFor="workTypeCode" className="text-xs font-medium">
            Work Type *
          </Label>
          <Select
            value={watch("workTypeCode")}
            onValueChange={(v) => {
              if (v) setValue("workTypeCode", v);
            }}
            disabled={!selectedCategory}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue
                placeholder={selectedCategory ? "Select type" : "Select category first"}
              />
            </SelectTrigger>
            <SelectContent>
              {filteredTypes.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  {type.code} - {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.workTypeCode && (
            <p className="text-[10px] text-destructive">{errors.workTypeCode.message}</p>
          )}
          {selectedType && (
            <p className="text-[10px] text-muted-foreground">
              Target: {selectedType.targetDays} days
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-medium">
          Description *
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={3}
          className="text-xs"
          placeholder="Describe the work performed..."
        />
        {errors.description && (
          <p className="text-[10px] text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Reference Number */}
        <div className="space-y-1.5">
          <Label htmlFor="referenceNumber" className="text-xs font-medium">
            Reference Number *
          </Label>
          <Input
            id="referenceNumber"
            {...register("referenceNumber")}
            className="h-8 text-xs"
            placeholder="CLW/DE/DWG/2024/..."
          />
          {errors.referenceNumber && (
            <p className="text-[10px] text-destructive">{errors.referenceNumber.message}</p>
          )}
        </div>

        {/* PL Number */}
        <div className="space-y-1.5">
          <Label htmlFor="plNumber" className="text-xs font-medium">
            PL Number (8 digits)
          </Label>
          <Input
            id="plNumber"
            {...register("plNumber")}
            className="h-8 text-xs"
            placeholder="27180001"
            maxLength={8}
          />
          {errors.plNumber && (
            <p className="text-[10px] text-destructive">{errors.plNumber.message}</p>
          )}
        </div>

        {/* Drawing Number */}
        <div className="space-y-1.5">
          <Label htmlFor="drawingNumber" className="text-xs font-medium">
            Drawing Number
          </Label>
          <Input
            id="drawingNumber"
            {...register("drawingNumber")}
            className="h-8 text-xs"
            placeholder="CLW-TM-GA-001-R3"
          />
        </div>

        {/* Specification Number */}
        <div className="space-y-1.5">
          <Label htmlFor="specificationNumber" className="text-xs font-medium">
            Specification Number
          </Label>
          <Input
            id="specificationNumber"
            {...register("specificationNumber")}
            className="h-8 text-xs"
            placeholder="RDSO/EL/SPEC/..."
          />
        </div>

        {/* Tender Number */}
        <div className="space-y-1.5">
          <Label htmlFor="tenderNumber" className="text-xs font-medium">
            Tender Number
          </Label>
          <Input
            id="tenderNumber"
            {...register("tenderNumber")}
            className="h-8 text-xs"
            placeholder="CLW/EL/TENDER/2024/..."
          />
        </div>

        {/* Concerned Officer */}
        <div className="space-y-1.5">
          <Label htmlFor="concernedOfficer" className="text-xs font-medium">
            Concerned Officer
          </Label>
          <Input
            id="concernedOfficer"
            {...register("concernedOfficer")}
            className="h-8 text-xs"
            placeholder="Officer name/designation"
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks" className="text-xs font-medium">
          Remarks
        </Label>
        <Textarea
          id="remarks"
          {...register("remarks")}
          rows={2}
          className="text-xs"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Record"}
        </Button>
      </div>
    </form>
  );
}
