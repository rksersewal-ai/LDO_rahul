"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { ApprovalDialog } from "@/components/approvals/approval-dialog";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApprovalType, MockApproval } from "@/lib/mock-data/approvals";
import { MOCK_APPROVALS } from "@/lib/mock-data/approvals";

type FilterTab = "all" | ApprovalType;

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<MockApproval[]>(MOCK_APPROVALS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
  const [selectedApproval, setSelectedApproval] = useState<MockApproval | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const filteredApprovals =
    activeTab === "all" ? pendingApprovals : pendingApprovals.filter((a) => a.type === activeTab);

  const handleApproveClick = (approval: MockApproval) => {
    // One-click approve for non-critical items
    if (approval.urgency !== "CRITICAL") {
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === approval.id
            ? {
                ...a,
                status: "APPROVED" as const,
                decidedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      );
      return;
    }
    // For critical items, show confirmation dialog
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
    const newStatus = dialogAction === "approve" ? "APPROVED" : "REJECTED";
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === selectedApproval.id
          ? {
              ...a,
              status: newStatus as MockApproval["status"],
              decisionNotes: notes || null,
              decidedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    );
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
