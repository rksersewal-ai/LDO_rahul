"use client";

import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// Mock work records data for demonstration
const mockWorkRecords = [
  {
    id: "wr-001",
    date: "2024-12-10",
    category: "Inspection",
    description: "Periodic dimensional inspection",
    status: "Completed",
    officer: "S.K. Sharma",
  },
  {
    id: "wr-002",
    date: "2024-11-22",
    category: "Maintenance",
    description: "Routine maintenance check",
    status: "Completed",
    officer: "R.P. Singh",
  },
  {
    id: "wr-003",
    date: "2024-11-05",
    category: "Testing",
    description: "Performance validation test",
    status: "In Progress",
    officer: "A.K. Gupta",
  },
];

export function PlWorkTab() {
  if (mockWorkRecords.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="h-5 w-5" />}
        title="No work records"
        description="Work records referencing this PL number will appear here."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Category
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
              Officer
            </th>
          </tr>
        </thead>
        <tbody>
          {mockWorkRecords.map((record) => (
            <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-3 py-2 text-muted-foreground">{record.date}</td>
              <td className="px-3 py-2">{record.category}</td>
              <td className="px-3 py-2">{record.description}</td>
              <td className="px-3 py-2">{record.status}</td>
              <td className="px-3 py-2 text-muted-foreground">{record.officer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
