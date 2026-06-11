"use client";

import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MockPlNumber } from "@/lib/mock-data/pl-numbers";
import { cn } from "@/lib/utils";

interface PlOverviewTabProps {
  pl: MockPlNumber;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-b-0">
      <dt className="w-[140px] shrink-0 text-xs text-muted-foreground font-medium">{label}</dt>
      <dd className="text-xs text-foreground">{value || "-"}</dd>
    </div>
  );
}

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

export function PlOverviewTab({ pl }: PlOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Basic Information
        </h3>
        <dl className="rounded-md border p-3">
          <InfoRow label="PL Number" value={pl.plNumber} />
          <InfoRow label="Name" value={pl.name} />
          <InfoRow label="Description" value={pl.description} />
          <div className="flex items-start gap-2 py-1.5 border-b border-border/50">
            <dt className="w-[140px] shrink-0 text-xs text-muted-foreground font-medium">
              Category
            </dt>
            <dd>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-semibold", getCategoryBadgeClass(pl.category))}
              >
                {pl.category}
              </Badge>
            </dd>
          </div>
          <InfoRow
            label="Status"
            value={pl.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          />
        </dl>
      </section>

      {/* Safety */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Safety
        </h3>
        <dl className="rounded-md border p-3">
          <div className="flex items-start gap-2 py-1.5 border-b border-border/50">
            <dt className="w-[140px] shrink-0 text-xs text-muted-foreground font-medium">
              Safety Critical
            </dt>
            <dd className="flex items-center gap-1.5">
              {pl.safetyCritical ? (
                <>
                  <Shield className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-medium text-destructive">Yes - Critical</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No</span>
              )}
            </dd>
          </div>
          {pl.safetyCritical && (
            <>
              <InfoRow label="Classification" value="Safety Critical Component" />
              <InfoRow label="Severity" value="High - Operational Safety" />
              <InfoRow label="Consequences" value="Potential service disruption" />
            </>
          )}
        </dl>
      </section>

      {/* Technical */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Technical
        </h3>
        <dl className="rounded-md border p-3">
          <InfoRow label="Drawing Ref" value={pl.drawingRef} />
          <InfoRow label="Specification" value={pl.specification} />
          <InfoRow label="Unit" value={pl.unit} />
        </dl>
      </section>

      {/* Administrative */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Administrative
        </h3>
        <dl className="rounded-md border p-3">
          <InfoRow label="Workshop" value={pl.workshop} />
          <InfoRow label="Created By" value={pl.createdBy} />
          <InfoRow label="Updated By" value={pl.updatedBy} />
          <InfoRow label="Created At" value={new Date(pl.createdAt).toLocaleDateString()} />
          <InfoRow label="Updated At" value={new Date(pl.updatedAt).toLocaleDateString()} />
        </dl>
      </section>
    </div>
  );
}
