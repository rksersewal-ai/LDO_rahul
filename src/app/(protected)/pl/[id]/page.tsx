"use client";

import { ArrowLeft, Pencil, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { InspectionWarningBanner } from "@/components/pl/inspection-warning-banner";
import { PlBomTab } from "@/components/pl/pl-bom-tab";
import { PlCasesTab } from "@/components/pl/pl-cases-tab";
import { PlDocumentsTab } from "@/components/pl/pl-documents-tab";
import { PlHistoryTab } from "@/components/pl/pl-history-tab";
import { type PlDetailData, PlOverviewTab } from "@/components/pl/pl-overview-tab";
import { PlWorkTab } from "@/components/pl/pl-work-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "CAT-A":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "CAT-B":
      return "bg-warning/10 text-warning border-warning/20";
    case "CAT-C":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
    case "CAT-D":
      return "bg-success/10 text-success border-success/20";
    default:
      return "";
  }
}

function mapPlStatus(status: string): StatusType {
  switch (status) {
    case "active":
      return "done";
    case "inactive":
      return "blocked";
    case "deprecated":
      return "failed";
    case "under_review":
      return "in_process";
    default:
      return "pending";
  }
}

export default function PlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: pl, isLoading, error } = trpc.pl.getById.useQuery({ id });

  if (isLoading) {
    return (
      <PageFrame>
        <LoadingState variant="card" rows={3} />
      </PageFrame>
    );
  }

  if (error || !pl) {
    return (
      <PageFrame>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-sm text-muted-foreground">
            {error ? error.message : "PL number not found"}
          </p>
          <Button variant="outline" size="sm" render={<Link href="/pl" />}>
            Back to PL Hub
          </Button>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit h-7 text-xs gap-1 -ml-2"
          render={<Link href="/pl" />}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to PL Hub
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-mono text-2xl font-bold tracking-tight">{pl.plNumber}</h1>
              {pl.itemType && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold",
                    pl.itemType === "VD"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                      : "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
                  )}
                >
                  {pl.itemType}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn("text-xs font-semibold", getCategoryBadgeClass(pl.category))}
              >
                {pl.category}
              </Badge>
              <StatusBadge
                status={mapPlStatus(pl.status)}
                label={pl.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              />
              {pl.lifecycleStage && (
                <Badge variant="secondary" className="text-[10px]">
                  {pl.lifecycleStage.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              )}
              {pl.safetyCritical && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  <Shield className="h-3 w-3" />
                  Safety Critical
                </span>
              )}
            </div>
            <h2 className="text-lg font-medium text-foreground">{pl.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{pl.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 text-xs"
            render={<Link href={`/pl/${pl.id}/edit`} />}
          >
            <Pencil className="h-3 w-3" />
            Edit PL
          </Button>
        </div>

        {/* Inspection Warning Banner for CAT-A items */}
        <InspectionWarningBanner plId={pl.id} category={pl.category} />

        {/* Tabs with URL-persisted active tab */}
        <Suspense fallback={null}>
          <PlDetailTabs pl={pl} />
        </Suspense>
      </div>
    </PageFrame>
  );
}

function PlDetailTabs({ pl }: { pl: PlDetailData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="bom">BOM</TabsTrigger>
        <TabsTrigger value="work">Work Records</TabsTrigger>
        <TabsTrigger value="traceability">Traceability</TabsTrigger>
        <TabsTrigger value="cases">Cases</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <PlOverviewTab pl={pl} />
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <PlDocumentsTab plId={pl.id} />
      </TabsContent>

      <TabsContent value="bom" className="mt-4">
        <PlBomTab plId={pl.id} />
      </TabsContent>

      <TabsContent value="work" className="mt-4">
        <PlWorkTab plId={pl.id} />
      </TabsContent>

      <TabsContent value="traceability" className="mt-4">
        <TraceabilityTab plId={pl.id} />
      </TabsContent>

      <TabsContent value="cases" className="mt-4">
        <PlCasesTab />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <PlHistoryTab />
      </TabsContent>
    </Tabs>
  );
}

// Inline traceability tab for the detail page
function TraceabilityTab({ plId }: { plId: string }) {
  const { data: summary, isLoading: summaryLoading } = trpc.pl.getTraceabilitySummary.useQuery({
    plId,
  });

  if (summaryLoading) {
    return <LoadingState variant="card" rows={2} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="text-2xl font-bold">{summary.documents}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">BOM Products</p>
            <p className="text-2xl font-bold">{summary.bomProducts}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">BOM Components</p>
            <p className="text-2xl font-bold">{summary.bomComponents}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Work Records</p>
            <p className="text-2xl font-bold">{summary.workRecords}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">OCR Hits</p>
            <p className="text-2xl font-bold">{summary.ocrHits}</p>
          </div>
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        <Link href={`/pl/${plId}/traceability`} className="text-primary hover:underline">
          View full traceability details
        </Link>
      </div>
    </div>
  );
}
