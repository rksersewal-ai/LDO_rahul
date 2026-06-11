"use client";

import { CheckCircle, Lock, RotateCcw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MockWorkRecord } from "@/lib/mock-data/work-records";
import { cn } from "@/lib/utils";
import { WorkKpiBadge } from "./work-kpi-badge";

interface WorkRecordDetailProps {
  record: MockWorkRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (id: string) => void;
  onVerify?: (id: string) => void;
  onReject?: (id: string) => void;
  onLock?: (id: string) => void;
  isSupervisor?: boolean;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBMITTED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}

export function WorkRecordDetail({
  record,
  open,
  onOpenChange,
  onSubmit,
  onVerify,
  onReject,
  onLock,
  isSupervisor = false,
}: WorkRecordDetailProps) {
  if (!record) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-sm">Work Record Detail</SheetTitle>
          <SheetDescription className="text-xs">{record.referenceNumber}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Status and KPI */}
          <div className="flex items-center justify-between">
            <Badge className={cn("text-[10px]", statusColors[record.status])}>
              {record.status}
            </Badge>
            <WorkKpiBadge daysTaken={record.daysTaken} targetDays={record.targetDays} />
          </div>

          {/* Work Info Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground border-b pb-1">
              Work Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Date" value={record.date} />
              <DetailRow label="Priority" value={record.priority} />
              <DetailRow label="Category" value={record.workCategory} />
              <DetailRow label="Type Code" value={record.workTypeCode} />
            </div>
            <DetailRow label="Type" value={record.workTypeLabel} />
            <DetailRow label="Description" value={record.description} />
          </div>

          {/* References Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground border-b pb-1">References</h4>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Reference Number" value={record.referenceNumber} />
              <DetailRow label="PL Number" value={record.plNumber} />
              <DetailRow label="Drawing Number" value={record.drawingNumber} />
              <DetailRow label="Specification" value={record.specificationNumber} />
              <DetailRow label="Tender Number" value={record.tenderNumber} />
              <DetailRow label="Concerned Officer" value={record.concernedOfficer} />
            </div>
          </div>

          {/* Disposal Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground border-b pb-1">
              Disposal Tracking
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Start Date" value={record.startDate} />
              <DetailRow label="Completed Date" value={record.completedDate} />
              <DetailRow label="Days Taken" value={`${record.daysTaken} days`} />
              <DetailRow label="Target" value={`${record.targetDays} days`} />
            </div>
          </div>

          {/* Status Audit */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground border-b pb-1">Status Trail</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-blue-500" />
                <span>Created: {new Date(record.createdAt).toLocaleString()}</span>
              </div>
              {record.submittedAt && (
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>Submitted: {new Date(record.submittedAt).toLocaleString()}</span>
                </div>
              )}
              {record.verifiedAt && (
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>
                    Verified: {new Date(record.verifiedAt).toLocaleString()}
                    {record.verifiedBy && ` by ${record.verifiedBy}`}
                  </span>
                </div>
              )}
              {record.lockedAt && (
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-gray-500" />
                  <span>Locked: {new Date(record.lockedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          {record.remarks && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground border-b pb-1">Remarks</h4>
              <p className="text-xs text-muted-foreground">{record.remarks}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {record.status === "OPEN" && onSubmit && (
              <Button size="sm" onClick={() => onSubmit(record.id)} className="gap-1.5">
                <Send className="size-3" />
                Submit for Verification
              </Button>
            )}
            {record.status === "SUBMITTED" && isSupervisor && onVerify && (
              <Button
                size="sm"
                onClick={() => onVerify(record.id)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="size-3" />
                Verify
              </Button>
            )}
            {record.status === "SUBMITTED" && isSupervisor && onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(record.id)}
                className="gap-1.5 text-red-600"
              >
                <RotateCcw className="size-3" />
                Return
              </Button>
            )}
            {record.status === "VERIFIED" && isSupervisor && onLock && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLock(record.id)}
                className="gap-1.5"
              >
                <Lock className="size-3" />
                Lock Record
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
