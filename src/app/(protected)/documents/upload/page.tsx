"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, ClipboardList, Eye, FileUp, Hash } from "lucide-react";
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
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";
import { cn } from "@/lib/utils";
import { type UploadFormValues, uploadFormSchema } from "@/lib/validators/documents-form";

type WizardStep = 1 | 2 | 3 | 4;

const steps = [
  { step: 1, label: "File Selection", icon: FileUp },
  { step: 2, label: "Dedup Check", icon: Hash },
  { step: 3, label: "Metadata", icon: ClipboardList },
  { step: 4, label: "Review", icon: Eye },
] as const;

/**
 * Simulate computing hashes for the uploaded file.
 * In production, this would use Web Crypto API + the dedup service.
 */
function simulateHashComputation(): DedupResult {
  const randomHash = () =>
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  // 10% chance of duplicate for demo
  const isDuplicate = Math.random() < 0.1;
  const existingDoc = isDuplicate ? MOCK_DOCUMENTS[0] : undefined;

  return {
    fullHash: randomHash(),
    threePointHash: randomHash(),
    isDuplicate,
    existingDocumentNumber: existingDoc?.documentNumber,
    existingDocumentTitle: existingDoc?.title,
    existingDocumentId: existingDoc?.id,
  };
}

export default function UploadDocumentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dedupResult, setDedupResult] = useState<DedupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setUploadProgress(0);

    // Simulate hash computation with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    // Simulate async dedup check
    await new Promise((resolve) => setTimeout(resolve, 1200));
    clearInterval(interval);
    setUploadProgress(100);
    setUploading(false);

    const result = simulateHashComputation();
    setDedupResult(result);
    setCurrentStep(2);
  }, [selectedFile]);

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
    if (!valid) return;

    setSubmitting(true);
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitting(false);
    router.push("/documents");
  }, [form, router]);

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
