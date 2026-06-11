"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { MockApproval } from "@/lib/mock-data/approvals";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approval: MockApproval | null;
  action: "approve" | "reject";
  onConfirm: (notes: string) => void;
  loading?: boolean;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  approval,
  action,
  onConfirm,
  loading,
}: ApprovalDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNotes("");
    }
    onOpenChange(newOpen);
  };

  if (!approval) return null;

  const isReject = action === "reject";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isReject ? "Reject Approval" : "Confirm Approval"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isReject
              ? "Please provide a reason for rejecting this request."
              : "Confirm that you want to approve this request."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="font-medium text-foreground">{approval.title}</p>
          <p className="mt-1 text-muted-foreground">{approval.description}</p>
          <div className="mt-2 flex items-center gap-4">
            <span>
              <span className="font-medium">Requester:</span> {approval.requesterName}
            </span>
            <span>
              <span className="font-medium">Entity:</span> {approval.linkedEntityLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="decision-notes" className="text-xs font-medium">
            {isReject ? "Reason for rejection *" : "Decision notes (optional)"}
          </label>
          <Textarea
            id="decision-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isReject
                ? "Enter the reason for rejection..."
                : "Add any notes about this decision..."
            }
            className="text-xs min-h-[80px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant={isReject ? "destructive" : "default"}
            className="h-8 text-xs"
            onClick={handleConfirm}
            disabled={loading || (isReject && !notes.trim())}
          >
            {loading ? "Processing..." : isReject ? "Reject" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
