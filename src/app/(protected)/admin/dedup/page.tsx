"use client";

import { Copy, Eye, GitMerge } from "lucide-react";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DuplicateGroup, MOCK_DUPLICATE_GROUPS } from "@/lib/mock-data/admin";

const matchTypeBadge: Record<
  string,
  { variant: "default" | "secondary" | "outline" | "destructive"; label: string }
> = {
  exact_hash: { variant: "destructive", label: "Exact Match" },
  three_point_hash: { variant: "default", label: "3-Point Hash" },
  metadata_match: { variant: "secondary", label: "Metadata Match" },
};

export default function DeduplicationPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([...MOCK_DUPLICATE_GROUPS]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const totalWasted = groups.reduce((sum, g) => sum + g.totalWastedMB, 0);
  const totalDuplicates = groups.reduce((sum, g) => sum + g.documentsCount - 1, 0);

  const handleMerge = (groupId: string, _keepId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  const handleKeepAll = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Deduplication"
          subtitle="Identify and manage duplicate documents based on file hash and metadata"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {groups.length} groups
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-5">
                {totalDuplicates} duplicates
              </Badge>
              <Badge variant="destructive" className="text-[10px] h-5">
                {totalWasted.toFixed(1)} MB wasted
              </Badge>
            </div>
          }
        />

        {/* Duplicate Groups */}
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const badge = matchTypeBadge[group.matchType];
            const isExpanded = expandedGroup === group.id;

            return (
              <div key={group.id} className="rounded-lg border bg-card">
                {/* Group Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedGroup(isExpanded ? null : group.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{group.documentsCount} documents</p>
                        <Badge variant={badge.variant} className="text-[10px] h-4">
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        Hash: {group.fileHash.slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {group.totalWastedMB.toFixed(1)} MB wasted
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Detected: {new Date(group.detectedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px]">Document Number</TableHead>
                          <TableHead className="text-[11px]">Title</TableHead>
                          <TableHead className="text-[11px]">Uploaded By</TableHead>
                          <TableHead className="text-[11px]">Upload Date</TableHead>
                          <TableHead className="text-[11px]">Size</TableHead>
                          <TableHead className="text-[11px]">Rev</TableHead>
                          <TableHead className="text-[11px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.documents.map((doc, idx) => (
                          <TableRow key={doc.id}>
                            <TableCell className="text-xs font-mono">
                              {doc.documentNumber}
                            </TableCell>
                            <TableCell className="text-xs">{doc.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {doc.uploadedBy}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] h-4">
                                {doc.revision}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] gap-0.5 px-1.5"
                                >
                                  <Eye className="h-2.5 w-2.5" />
                                  View
                                </Button>
                                {idx === 0 && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-6 text-[10px] gap-0.5 px-1.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMerge(group.id, doc.id);
                                    }}
                                  >
                                    <GitMerge className="h-2.5 w-2.5" />
                                    Keep This
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleKeepAll(group.id)}
                      >
                        Keep All (Not Duplicate)
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleMerge(group.id, group.documents[0].id)}
                      >
                        <GitMerge className="h-3 w-3" />
                        Merge (Keep First)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {groups.length === 0 && (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No duplicate groups found.</p>
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
