"use client";

import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// Mock cases data for demonstration
const mockCases = [
  {
    id: "case-001",
    caseNumber: "CS-2024-0142",
    title: "Bearing overheating incident report",
    status: "Open",
    severity: "High",
    assignee: "A.K. Gupta",
  },
  {
    id: "case-002",
    caseNumber: "CS-2024-0089",
    title: "Specification deviation request",
    status: "Resolved",
    severity: "Medium",
    assignee: "S.K. Sharma",
  },
];

export function PlCasesTab() {
  if (mockCases.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-5 w-5" />}
        title="No cases"
        description="Cases linked to this PL number will appear here."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Case #
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Title
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Severity
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Assignee
            </th>
          </tr>
        </thead>
        <tbody>
          {mockCases.map((c) => (
            <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-3 py-2 font-mono font-medium">{c.caseNumber}</td>
              <td className="px-3 py-2">{c.title}</td>
              <td className="px-3 py-2">{c.status}</td>
              <td className="px-3 py-2">{c.severity}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.assignee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
