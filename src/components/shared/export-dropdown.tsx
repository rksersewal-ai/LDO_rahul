"use client";

import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToExcel, exportToPdf, exportToWord } from "@/lib/utils/export-service";

export interface ExportDropdownProps {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  filenamePrefix: string;
}

export function ExportDropdown({ title, headers, rows, filenamePrefix }: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" />
            Export
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToExcel(title, headers, rows, filenamePrefix)}>
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Export Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToWord(title, headers, rows, filenamePrefix)}>
          <FileText className="h-3.5 w-3.5" />
          Export Word (.doc)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPdf(title, headers, rows)}>
          <Printer className="h-3.5 w-3.5" />
          Export PDF (Print)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToCSV(headers, rows, filenamePrefix)}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
