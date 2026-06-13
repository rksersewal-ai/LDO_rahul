"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { ApprovalDialog } from "@/components/approvals/approval-dialog";
import { PageFrame } from "@/components/layout/page-frame";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApprovalType, MockApproval } from "@/lib/mock-data/approvals";
import { trpc } from "@/lib/trpc/client";

type FilterTab = "all" | ApprovalType;

export default function ApprovalsPage() {
  const { data: approvalsData, isLoading, isError, error, refetch } = trpc.approvals.list.useQuery(
    { status: "pending", limit: 100 },
    { staleTime: 15_000 },
  );

  const approvals: MockApproval[] = (approvalsData?.items ?? []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    title: (item.entityType as string) ?? "Approval Request",
    description: `Approval for ${(item.entityType as string) ?? "item"} - ${(item.entityId as string) ?? ""}`,
    type: ((item.entityType as string) === "document" ? "document_release" : (item.entityType as string) === "bom" ? "bom_change" : "work_verification") as ApprovalType,
    status: ((item.status as string) ?? "pending").toUpperCase() as MockApproval["status"],
    urgency: "NORMAL" as MockApproval["urgency"],
    requesterId: (item.requestedBy as string) ?? "",
    requesterName: (item.requestedBy as string) ?? "Unknown",
    approverId: "",
    approverName: "",
    linkedEntityId: (item.entityId as string) ?? "",
    linkedEntityType: (item.entityType as string) ?? "",
    linkedEntityLabel: (item.entityId as string) ?? "",
    dueDate: (item.createdAt as string) ?? new Date().toISOString(),
    decisionNotes: null,
    decidedAt: null,
    createdAt: (item.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (item.updatedAt as string) ?? new Date().toISOString(),
  }));

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
  const [selectedApproval, setSelectedApproval] = useState<MockApproval | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const filteredApprovals =
    activeTab === "all" ? pendingApprovals : pendingApprovals.filter((a) => a.type === activeTab);

  const approveMutation = trpc.approvals.approveStep.useMutation({
    onSuccess: () => refetch(),
  });

  const handleApproveClick = (approval: MockApproval) => {
    if (approval.urgency !== "CRITICAL") {
      approveMutation.mutate({ requestId: approval.id, comments: "" });
      return;
    }
    setSelectedApproval(approval);
    setDialogAction("approve");
    setDialogOpen(true);
  };

  const handleRejectClick = (approval: MockApproval) => {
    setSelectedApproval(approval);
    setDialogAction("reject");
    setDialogOpen(true);
  };

  const handleConfirm = (notes: string) => {
    if (!selectedApproval) return;
    approveMutation.mutate({ requestId: selectedApproval.id, comments: notes });
    setDialogOpen(false);
    setSelectedApproval(null);
  };

  const docReleaseCount = pendingApprovals.filter((a) => a.type === "document_release").length;
  const workVerifCount = pendingApprovals.filter((a) => a.type === "work_verification").length;
  const bomChangeCount = pendingApprovals.filter((a) => a.type === "bom_change").length;

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Pending Approvals"
          subtitle="Review and approve pending requests"
          actions={
            <Badge variant="secondary" className="h-6 text-xs">
              {pendingApprovals.length} pending
            </Badge>
          }
        />

        {/* Error State */}
        {isError && !isLoading && (
          <QueryErrorState error={error} retry={() => refetch()} />
        )}

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All ({pendingApprovals.length})</TabsTrigger>
            <TabsTrigger value="document_release">Document Release ({docReleaseCount})</TabsTrigger>
            <TabsTrigger value="work_verification">
              Work Verification ({workVerifCount})
            </TabsTrigger>
            <TabsTrigger value="bom_change">BOM Change ({bomChangeCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Check className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No pending approvals</p>
                <p className="text-xs text-muted-foreground mt-1">All caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    onApprove={handleApproveClick}
                    onReject={handleRejectClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        approval={selectedApproval}
        action={dialogAction}
        onConfirm={handleConfirm}
      />
    </PageFrame>
  );
}
