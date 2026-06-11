"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { PlBomTab } from "@/components/pl/pl-bom-tab";
import { PlCasesTab } from "@/components/pl/pl-cases-tab";
import { PlDocumentsTab } from "@/components/pl/pl-documents-tab";
import { PlHistoryTab } from "@/components/pl/pl-history-tab";
import { PlOverviewTab } from "@/components/pl/pl-overview-tab";
import { PlWorkTab } from "@/components/pl/pl-work-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents";
import { MOCK_PL_NUMBERS } from "@/lib/mock-data/pl-numbers";
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
  const pl = MOCK_PL_NUMBERS.find((p) => p.id === id);

  if (!pl) {
    return (
      <PageFrame>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-sm text-muted-foreground">PL number not found</p>
          <Button variant="outline" size="sm" render={<Link href="/pl" />}>
            Back to PL Hub
          </Button>
        </div>
      </PageFrame>
    );
  }

  // Get linked documents
  const linkedDocuments = MOCK_DOCUMENTS.filter((doc) => doc.linkedPlIds.includes(pl.id));

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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-mono text-2xl font-bold tracking-tight">{pl.plNumber}</h1>
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {linkedDocuments.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
                  {linkedDocuments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bom">BOM</TabsTrigger>
            <TabsTrigger value="work">Work Records</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <PlOverviewTab pl={pl} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <PlDocumentsTab documents={linkedDocuments} plId={pl.id} />
          </TabsContent>

          <TabsContent value="bom" className="mt-4">
            <PlBomTab />
          </TabsContent>

          <TabsContent value="work" className="mt-4">
            <PlWorkTab />
          </TabsContent>

          <TabsContent value="cases" className="mt-4">
            <PlCasesTab />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <PlHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageFrame>
  );
}
