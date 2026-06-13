"use client";

import { ExternalLink, FileText, Shield } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlAlias {
  id: string;
  plId: string;
  alias: string;
  aliasType: "legacy" | "vendor" | "drawing" | "local_name";
  createdAt: Date | string;
  [key: string]: unknown;
}

interface PlRelationship {
  id: string;
  sourcePlId: string;
  targetPlId: string;
  relationType: "equivalent_to" | "substitute_for" | "supersedes" | "child_of" | "accessory_of" | "related_to";
  notes: string | null;
  createdAt: Date | string;
  [key: string]: unknown;
}

export interface PlDetailData {
  id: string;
  plNumber: string;
  name: string;
  description: string | null;
  category: "CAT-A" | "CAT-B" | "CAT-C" | "CAT-D";
  status: "active" | "inactive" | "deprecated" | "under_review" | "obsolete";
  safetyCritical: boolean;
  drawingRef: string | null;
  specification: string | null;
  unit: string | null;
  workshop: string | null;
  manufacturer: string | null;
  vendorCode: string | null;
  partFamily: string | null;
  lifecycleStage: "draft" | "active" | "restricted" | "obsolete" | "deprecated" | null;
  lastUsedAt: Date | string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  aliases: PlAlias[];
  relationships: PlRelationship[];
  // Railway-specific fields
  itemType: "VD" | "NVD" | null;
  uvamItemId: string | null;
  eligibilityCriteriaText: string | null;
  eligibilityCriteriaDocId: string | null;
  strDocId: string | null;
  qapDocId: string | null;
  inspectionAgency: "RDSO" | "ZONAL" | "WORKSHOP" | "STORES" | null;
  unitOfMeasurement: string | null;
  shelfLifeMonths: number | null;
  lastProcurementRate: number | null;
  lastProcurementDate: Date | string | null;
  [key: string]: unknown;
}

interface PlOverviewTabProps {
  pl: PlDetailData;
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

function getAliasTypeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "legacy":
      return "secondary";
    case "vendor":
      return "default";
    default:
      return "outline";
  }
}

export function PlOverviewTab({ pl }: PlOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Item Type & UVAM */}
      {pl.itemType && (
        <section className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Item Classification
          </h3>
          <div className="rounded-md border p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-bold px-3 py-1",
                  pl.itemType === "VD"
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                    : "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
                )}
              >
                {pl.itemType === "VD" ? "VD - Vendor Developed" : "NVD - Non-Vendor Developed"}
              </Badge>
              {pl.itemType === "VD" && pl.uvamItemId && (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">UVAM ID:</span>
                  <span className="font-mono font-medium text-primary">{pl.uvamItemId}</span>
                </span>
              )}
              {pl.itemType === "VD" && !pl.uvamItemId && (
                <Badge variant="secondary" className="text-[10px]">UVAM Registered</Badge>
              )}
            </div>
            {/* Eligibility Criteria */}
            {pl.itemType === "NVD" && pl.eligibilityCriteriaText && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-medium mb-1">Eligibility Criteria</p>
                <p className="text-xs text-foreground">{pl.eligibilityCriteriaText}</p>
              </div>
            )}
            {/* Linked STR/QAP Documents */}
            {(pl.strDocId || pl.qapDocId) && (
              <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-3">
                {pl.strDocId && (
                  <Link
                    href={`/documents/${pl.strDocId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    Linked STR Document
                  </Link>
                )}
                {pl.qapDocId && (
                  <Link
                    href={`/documents/${pl.qapDocId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    Linked QAP Document
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

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
          <InfoRow
            label="Lifecycle Stage"
            value={pl.lifecycleStage ? pl.lifecycleStage.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null}
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
          <InfoRow label="Manufacturer" value={pl.manufacturer} />
          <InfoRow label="Vendor Code" value={pl.vendorCode} />
          <InfoRow label="Part Family" value={pl.partFamily} />
        </dl>
      </section>

      {/* Procurement & Inspection */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Procurement & Inspection
        </h3>
        <dl className="rounded-md border p-3">
          <InfoRow
            label="Inspection Agency"
            value={pl.inspectionAgency ?? null}
          />
          <InfoRow
            label="Unit of Measurement"
            value={pl.unitOfMeasurement ?? null}
          />
          <InfoRow
            label="Shelf Life"
            value={pl.shelfLifeMonths != null ? `${pl.shelfLifeMonths} months` : null}
          />
          <InfoRow
            label="Last Rate"
            value={pl.lastProcurementRate != null ? `INR ${pl.lastProcurementRate.toLocaleString()}` : null}
          />
          <InfoRow
            label="Last Procured"
            value={pl.lastProcurementDate ? new Date(pl.lastProcurementDate).toLocaleDateString() : null}
          />
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

      {/* Aliases */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Aliases
        </h3>
        <div className="rounded-md border p-3">
          {pl.aliases.length === 0 ? (
            <p className="text-xs text-muted-foreground">No aliases defined</p>
          ) : (
            <ul className="space-y-1.5">
              {pl.aliases.map((alias) => (
                <li key={alias.id} className="flex items-center gap-2">
                  <Badge variant={getAliasTypeBadgeVariant(alias.aliasType)} className="text-[10px]">
                    {alias.aliasType.replace("_", " ")}
                  </Badge>
                  <span className="text-xs font-mono">{alias.alias}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Relationships */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Relationships
        </h3>
        <div className="rounded-md border p-3">
          {pl.relationships.length === 0 ? (
            <p className="text-xs text-muted-foreground">No relationships defined</p>
          ) : (
            <ul className="space-y-1.5">
              {pl.relationships.map((rel) => {
                const isSource = rel.sourcePlId === pl.id;
                const relatedPlId = isSource ? rel.targetPlId : rel.sourcePlId;
                return (
                  <li key={rel.id} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {rel.relationType.replace(/_/g, " ")}
                    </Badge>
                    <Link
                      href={`/pl/${relatedPlId}`}
                      className="text-xs text-primary hover:underline font-mono"
                    >
                      {relatedPlId}
                    </Link>
                    {rel.notes && (
                      <span className="text-xs text-muted-foreground">({rel.notes})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
