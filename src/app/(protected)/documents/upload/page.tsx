"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Check, ClipboardList, Eye, FileUp, Hash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { DedupCheck, type DedupResult } from "@/components/documents/dedup-check";
import { DocumentMetadataForm } from "@/components/documents/document-metadata-form";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc/client";
import { computeSha256, uploadDocument } from "@/lib/upload/client";
import { cn } from "@/lib/utils";
import { type UploadFormValues, uploadFormSchema } from "@/lib/validators/documents-form";

type WizardStep = 1 | 2 | 3 | 4;

const steps = [
  { step: 1, label: "File Selection", icon: FileUp },
  { step: 2, label: "Dedup Check", icon: Hash },
  { step: 3, label: "Metadata", icon: ClipboardList },
  { step: 4, label: "Review", icon: Eye },
] as const;

export default function UploadDocumentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dedupResult, setDedupResult] = useState<DedupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema) as Resolver<UploadFormValues>,
    defaultValues: {
      documentNumber: "",
      title: "",
      category: "DRAWING",
      revision: "R0",
      revisionDate: null,
      agency: "CLW",
      tags: [],
      linkedPlIds: [],
      notes: "",
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleFileClear = useCallback(() => {
    setSelectedFile(null);
    setDedupResult(null);
  }, []);

  const handleNextFromFile = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      // Real SHA-256 hash of the file via Web Crypto.
      const fullHash = await computeSha256(selectedFile);
      setUploadProgress(60);

      // Real duplicate pre-check against the workspace.
      const dup = await utils.documents.checkDuplicate.fetch({ fileHash: fullHash });
      setUploadProgress(100);

      // The query result isn't a discriminated union, so read optional fields.
      const existing = dup as {
        existingDocumentId?: string;
        existingDocumentNumber?: string;
        existingDocumentTitle?: string;
      };

      setDedupResult({
        fullHash,
        // 3-point hash is computed server-side during dedup scans; reuse the
        // full hash for the review display.
        threePointHash: fullHash,
        isDuplicate: dup.isDuplicate,
        existingDocumentId: dup.isDuplicate ? existing.existingDocumentId : undefined,
        existingDocumentNumber: dup.isDuplicate ? existing.existingDocumentNumber : undefined,
        existingDocumentTitle: dup.isDuplicate ? existing.existingDocumentTitle : undefined,
      });
      setCurrentStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process the file.");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, utils]);

  const handleDedupLinkExisting = useCallback(() => {
    if (dedupResult?.existingDocumentId) {
      router.push(`/documents/${dedupResult.existingDocumentId}`);
    }
  }, [dedupResult, router]);

  const handleDedupUploadNew = useCallback(() => {
    setCurrentStep(3);
  }, []);

  const handleNextFromDedup = useCallback(() => {
    setCurrentStep(3);
  }, []);

  const handleNextFromMetadata = useCallback(async () => {
    const valid = await form.trigger();
    if (valid) {
      setCurrentStep(4);
    }
  }, [form]);

  const handleSubmit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid || !selectedFile) return;

    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      const values = form.getValues();
      const res = await uploadDocument({
        file: selectedFile,
        metadata: {
          documentNumber: values.documentNumber,
          title: values.title,
          category: values.category,
          revision: values.revision,
          revisionDate: values.revisionDate ?? null,
          agency: values.agency,
          tags: values.tags,
          linkedPlIds: values.linkedPlIds,
        },
        onProgress: setUploadProgress,
      });

      // Refresh the documents list cache, then navigate to the new document.
      await utils.documents.list.invalidate();
      router.push(`/documents/${res.documentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setSubmitting(false);
    }
  }, [form, selectedFile, router, utils]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  }, [currentStep]);

  return (
    <PageFrame size="md">
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href="/documents" />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Documents
        </Button>

        <PageHeader title="Upload Document" subtitle="Add a new document to the repository" />

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {steps.map(({ step, label, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  currentStep === step
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {currentStep > step ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{step}</span>
              </div>
              {step < 4 && (
                <div
                  className={cn("w-8 h-px mx-1", currentStep > step ? "bg-success" : "bg-border")}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-lg border bg-card p-6">
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold">Select File</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a PDF, TIFF, PNG, or JPEG document (max 500MB)
                </p>
              </div>
              <UploadDropzone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleFileClear}
                uploading={uploading}
                uploadProgress={uploadProgress}
                error={currentStep === 1 ? error : null}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!selectedFile || uploading}
                  onClick={handleNextFromFile}
                >
                  {uploading ? "Processing..." : "Next: Check Duplicates"}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && dedupResult && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold">Deduplication Check</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verifying file uniqueness using SHA-256 and 3-point 64KB hash
                </p>
              </div>
              <DedupCheck
                result={dedupResult}
                onLinkExisting={handleDedupLinkExisting}
                onUploadNew={handleDedupUploadNew}
              />
              <div className="flex justify-between">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleBack}>
                  Back
                </Button>
                {!dedupResult.isDuplicate && (
                  <Button size="sm" className="h-8 text-xs" onClick={handleNextFromDedup}>
                    Next: Enter Metadata
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold">Document Metadata</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter document details and classification information
                </p>
              </div>
              <DocumentMetadataForm form={form} />
              <div className="flex justify-between">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleBack}>
                  Back
                </Button>
                <Button size="sm" className="h-8 text-xs" onClick={handleNextFromMetadata}>
                  Next: Review
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold">Review and Submit</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verify all information before uploading
                </p>
              </div>

              {/* Review summary */}
              <div className="grid grid-cols-2 gap-3">
                {/* File info */}
                <div className="rounded-md border p-3">
                  <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                    File
                  </h4>
                  <p className="text-xs font-medium truncate">{selectedFile?.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedFile && `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>

                {/* Hash info */}
                <div className="rounded-md border p-3">
                  <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                    Integrity
                  </h4>
                  <p className="text-[10px] font-mono truncate">
                    SHA: {dedupResult?.fullHash.slice(0, 16)}...
                  </p>
                  <Badge variant="secondary" className="text-[9px] mt-1">
                    No duplicates
                  </Badge>
                </div>

                {/* Metadata summary */}
                <div className="col-span-2 rounded-md border p-3">
                  <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Doc #: </span>
                      <span className="font-mono font-medium">
                        {form.getValues("documentNumber") || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category: </span>
                      <span className="font-medium">{form.getValues("category")}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Title: </span>
                      <span className="font-medium">{form.getValues("title") || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revision: </span>
                      <span className="font-mono">{form.getValues("revision")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agency: </span>
                      <span>{form.getValues("agency")}</span>
                    </div>
                    {form.getValues("tags").length > 0 && (
                      <div className="col-span-2 flex items-center gap-1 flex-wrap">
                        <span className="text-muted-foreground">Tags: </span>
                        {form.getValues("tags").map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {submitting && (
                <div>
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Uploading..." : "Submit Document"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
