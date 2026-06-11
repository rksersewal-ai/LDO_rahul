"use client";

import { GitBranch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function PlBomTab() {
  return (
    <EmptyState
      icon={<GitBranch className="h-5 w-5" />}
      title="Bill of Materials"
      description="Product structure and BOM data will appear here once the BOM module is connected. This shows where this PL number appears in assemblies and parent items."
    />
  );
}
