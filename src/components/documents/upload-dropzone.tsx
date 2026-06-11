"use client";

import { AlertCircle, FileText, FileUp, Image, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["application/pdf", "image/tiff", "image/png", "image/jpeg"];

const ACCEPTED_EXTENSIONS = [".pdf", ".tiff", ".tif", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  return FileText;
}

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  className?: string;
}

export function UploadDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  uploading = false,
  uploadProgress = 0,
  error,
  className,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type. Accepted: PDF, TIFF, PNG, JPEG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setValidationError(err);
        return;
      }
      setValidationError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const displayError = error || validationError;

  if (selectedFile) {
    const Icon = getFileIcon(selectedFile.type);
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)} - {selectedFile.type || "Unknown type"}
            </p>
          </div>
          {!uploading && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploading && (
          <div className="mt-3">
            <Progress value={uploadProgress} className="h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">Processing... {uploadProgress}%</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          displayError && "border-destructive/50",
        )}
      >
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
          <FileUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
        </div>
        <p className="text-[10px] text-muted-foreground">PDF, TIFF, PNG, JPEG up to 500MB</p>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  );
}
