"use client";

import { AlertTriangle, Check, ChevronDown, ChevronUp, Clock, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MockApproval } from "@/lib/mock-data/approvals";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  document_release: "Document Release",
  work_verification: "Work Verification",
  bom_change: "BOM Change",
};

const urgencyConfig: Record<string, { className: string; label: string }> = {
  LOW: {
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "Low",
  },
  NORMAL: {
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Normal",
  },
  HIGH: {
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    label: "High",
  },
  CRITICAL: {
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Critical",
  },
};

interface ApprovalCardProps {
  approval: MockApproval;
  onApprove: (approval: MockApproval) => void;
  onReject: (approval: MockApproval) => void;
}

export function ApprovalCard({ approval, onApprove, onReject }: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const urgency = urgencyConfig[approval.urgency] || urgencyConfig.NORMAL;

  const daysUntilDue = Math.ceil(
    (new Date(approval.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0;

  return (
    <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-medium">
              {typeLabels[approval.type]}
            </Badge>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                urgency.className,
              )}
            >
              {urgency.label}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-destructive">
                <AlertTriangle className="size-3" />
                Overdue
              </span>
            )}
            {isUrgent && !isOverdue && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-warning">
                <Clock className="size-3" />
                Due soon
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-foreground truncate">{approval.title}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>From: {approval.requesterName}</span>
            <span>Entity: {approval.linkedEntityLabel}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span>Due: {new Date(approval.dueDate).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {approval.urgency !== "CRITICAL" && (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onApprove(approval)}>
              <Check className="size-3" />
              Approve
            </Button>
          )}
          {approval.urgency === "CRITICAL" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onApprove(approval)}
            >
              <Check className="size-3" />
              Approve
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs gap-1"
            onClick={() => onReject(approval)}
          >
            <X className="size-3" />
            Reject
          </Button>
        </div>
      </div>

      {/* Expandable section */}
      <button
        type="button"
        className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {expanded ? "Less" : "More details"}
      </button>

      {expanded && (
        <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>{approval.description}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="font-medium text-foreground">Linked to:</span>{" "}
              {approval.linkedEntityLabel}
            </div>
            <div>
              <span className="font-medium text-foreground">Requested:</span>{" "}
              {new Date(approval.createdAt).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
