"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, FileIcon, Upload, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { DatePicker } from "@/components/shared/date-picker";
import { PLNumberSelect } from "@/components/shared/pl-number-select";
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
  WORK_TYPES,
  type WorkCategoryCode,
} from "@/lib/mock-data/work-categories";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { type CreateWorkRecordInput, createWorkRecordSchema } from "@/lib/validators/work-records";

interface WorkRecordFormProps {
  onSubmit: (data: CreateWorkRecordInput) => void;
  isLoading?: boolean;
  className?: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkRecordForm({ onSubmit, isLoading, className }: WorkRecordFormProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateWorkRecordInput>({
    resolver: zodResolver(createWorkRecordSchema) as never,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      workCategory: undefined,
      workTypeCode: "",
      description: "",
      referenceNumber: "",
      eOfficeCaseNumber: "",
      plNumber: null,
      drawingNumber: null,
      specificationNumber: null,
      tenderNumber: null,
      remarks: null,
      priority: "MEDIUM",
      concernedOfficer: null,
      supervisorId: null,
      startDate: new Date().toISOString().split("T")[0],
      closingDate: null,
      consent: null,
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
  const selectedTypeCode = watch("workTypeCode");
  const startDate = watch("startDate");
  const closingDate = watch("closingDate");
  const eOfficeCaseNumber = watch("eOfficeCaseNumber");
  const plNumber = watch("plNumber");

  const filteredTypes = useMemo(() => {
    if (!selectedCategory) return [];
    return getWorkTypesByCategory(selectedCategory as WorkCategoryCode);
  }, [selectedCategory]);

  const selectedType = useMemo(
    () => WORK_TYPES.find((t) => t.code === selectedTypeCode),
    [selectedTypeCode],
  );

  // Auto days-taken calculation
  const daysTaken = useMemo(() => {
    if (!startDate || !closingDate) return null;
    const start = new Date(startDate);
    const end = new Date(closingDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [startDate, closingDate]);

  // Supervisors and admins for dropdown
  const { data: usersData } = trpc.admin.getUsers.useQuery(
    { isActive: true },
    { staleTime: 60_000 },
  );
  const supervisors = useMemo(() => {
    return (usersData ?? []).filter((u) => u.role === "supervisor" || u.role === "admin");
  }, [usersData]);

  // Consent applicability - show for SDR category types
  const consentApplicable = useMemo(() => {
    if (!selectedType) return false;
    // Consent is applicable for SDR/Deviation work types
    return selectedType.category === "SDR";
  }, [selectedType]);

  // Duplicate detection
  const { data: workRecordsData } = trpc.work.list.useQuery(
    { limit: 100 },
    { staleTime: 30_000 },
  );
  const duplicates = useMemo(() => {
    if (!selectedTypeCode || (!eOfficeCaseNumber && !plNumber)) return [];
    const records = workRecordsData?.data ?? [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return records.filter((record) => {
      if (record.title && !record.title.includes(selectedTypeCode)) return false;
      const recordDate = new Date(record.createdAt);
      if (recordDate < thirtyDaysAgo) return false;
      if (eOfficeCaseNumber && record.description?.includes(eOfficeCaseNumber)) return true;
      if (plNumber && record.title?.includes(plNumber)) return true;
      return false;
    });
  }, [selectedTypeCode, eOfficeCaseNumber, plNumber, workRecordsData]);

  // File attachment handlers
  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      size: file.size,
      file,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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
                setValue("consent", null);
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
        </div>
      </div>

      {/* Target Days Banner */}
      {selectedType && (
        <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-xs">
          <span className="font-medium">Target Disposal:</span>{" "}
          <span className="font-bold">{selectedType.targetDays} days</span>
          <span className="text-muted-foreground ml-2">
            ({selectedType.label} - {selectedType.categoryLabel})
          </span>
        </div>
      )}

      {/* e-Office Case Number */}
      <div className="space-y-1.5">
        <Label htmlFor="eOfficeCaseNumber" className="text-xs font-medium">
          e-Office Case Number *
        </Label>
        <Input
          id="eOfficeCaseNumber"
          {...register("eOfficeCaseNumber")}
          className="h-8 text-xs"
          placeholder="e.g. CLW/DE/eOFF/2024/001"
        />
        {errors.eOfficeCaseNumber && (
          <p className="text-[10px] text-destructive">{errors.eOfficeCaseNumber.message}</p>
        )}
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

        {/* PL Number - Typeahead */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">PL Number (8 digits)</Label>
          <PLNumberSelect
            value={plNumber ?? null}
            onChange={(val) => setValue("plNumber", val)}
            placeholder="Search PL number..."
          />
          {errors.plNumber && (
            <p className="text-[10px] text-destructive">{errors.plNumber.message}</p>
          )}
        </div>

        {/* Supervisor Assignment */}
        <div className="space-y-1.5">
          <Label htmlFor="supervisorId" className="text-xs font-medium">
            Supervisor Assignment
          </Label>
          <Select
            value={watch("supervisorId") ?? ""}
            onValueChange={(v) => {
              setValue("supervisorId", v || null);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Assign supervisor..." />
            </SelectTrigger>
            <SelectContent>
              {supervisors.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.designation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* Start Date */}
        <DatePicker
          id="startDate"
          label="Start Date *"
          value={startDate || ""}
          onChange={(val) => setValue("startDate", val)}
          error={errors.startDate?.message}
        />

        {/* Closing Date */}
        <div className="space-y-1.5">
          <DatePicker
            id="closingDate"
            label="Closing Date"
            value={closingDate || ""}
            onChange={(val) => setValue("closingDate", val || null)}
            minDate={startDate || undefined}
            error={errors.closingDate?.message}
          />
          {/* Auto days-taken badge */}
          {daysTaken !== null && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {daysTaken} {daysTaken === 1 ? "day" : "days"} taken
              </span>
              {selectedType && daysTaken > selectedType.targetDays && (
                <span className="text-[10px] text-destructive font-medium">
                  (exceeds target of {selectedType.targetDays}d)
                </span>
              )}
            </div>
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

        {/* Consent field - conditional on work type */}
        {consentApplicable && (
          <div className="space-y-1.5">
            <Label htmlFor="consent" className="text-xs font-medium">
              Consent
            </Label>
            <Select
              value={watch("consent") ?? ""}
              onValueChange={(v) => {
                setValue("consent", (v || null) as "Yes" | "No" | "N/A" | null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select consent..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
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

      {/* Duplicate Detection Warning */}
      {duplicates.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Potential Duplicate Records Detected
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Similar work records found in the last 30 days:
              </p>
              <ul className="space-y-1 mt-1">
                {duplicates.map((dup) => (
                  <li key={dup.id} className="text-[10px] text-amber-700 dark:text-amber-400">
                    <span className="font-mono font-medium">{dup.title}</span> -{" "}
                    {(dup.description ?? "").slice(0, 60)}... ({new Date(dup.createdAt).toLocaleDateString("en-IN")})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File Attachment Drop Zone */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Attachments</Label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          className={cn(
            "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragOver && "border-primary/40 bg-primary/5",
            "hover:border-primary/40",
          )}
        >
          <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            PDF, Word, Excel, Images (max 10MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Attached files list */}
        {attachedFiles.length > 0 && (
          <div className="space-y-1.5">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs"
              >
                <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="ml-1 rounded-sm p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Record"}
        </Button>
      </div>
    </form>
  );
}
