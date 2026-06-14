"use client";

import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  HardDrive,
  Layers,
  Loader2,
  ScanText,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  HardDrive,
  Users,
  Upload,
  ScanText,
  Layers,
  ClipboardList,
  AlertTriangle,
};

export default function ReportsPage() {
  const { data: reportTypes, isLoading } = trpc.reports.listReportTypes.useQuery();
  const generateMutation = trpc.reports.generateReport.useMutation();

  const [formats, setFormats] = useState<Record<string, "csv" | "xlsx">>({});
  const [dateRanges, setDateRanges] = useState<
    Record<string, { from?: string; to?: string }>
  >({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerate = async (reportId: string) => {
    const format = formats[reportId] ?? "csv";
    const dateRange = dateRanges[reportId];

    setGeneratingId(reportId);
    try {
      const result = await generateMutation.mutateAsync({
        type: reportId,
        format,
        dateRange: dateRange?.from || dateRange?.to ? dateRange : undefined,
      });

      // Decode base64 and trigger download
      const binaryStr = atob(result.data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success(`${result.filename} downloaded successfully`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate report",
      );
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <PageFrame>
      <PageHeader
        title="Reports Hub"
        subtitle="Generate and download data reports for your workspace"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes?.map((report) => {
          const IconComponent = ICON_MAP[report.icon] ?? BarChart3;
          const isGenerating = generatingId === report.id;

          return (
            <Card key={report.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    className="h-8 text-xs"
                    value={dateRanges[report.id]?.from ?? ""}
                    onChange={(e) =>
                      setDateRanges((prev) => ({
                        ...prev,
                        [report.id]: {
                          ...prev[report.id],
                          from: e.target.value || undefined,
                        },
                      }))
                    }
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    className="h-8 text-xs"
                    value={dateRanges[report.id]?.to ?? ""}
                    onChange={(e) =>
                      setDateRanges((prev) => ({
                        ...prev,
                        [report.id]: {
                          ...prev[report.id],
                          to: e.target.value || undefined,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={formats[report.id] ?? "csv"}
                    onValueChange={(val) =>
                      setFormats((prev) => ({
                        ...prev,
                        [report.id]: val as "csv" | "xlsx",
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    onClick={() => handleGenerate(report.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Report"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageFrame>
  );
}
