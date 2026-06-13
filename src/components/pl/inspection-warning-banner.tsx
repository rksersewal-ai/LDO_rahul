"use client";

import { AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface InspectionWarningBannerProps {
  plId: string;
  category: string;
}

export function InspectionWarningBanner({ plId, category }: InspectionWarningBannerProps) {
  // Only show for CAT-A items
  if (category !== "CAT-A") {
    return null;
  }

  return <InspectionWarningContent plId={plId} />;
}

function InspectionWarningContent({ plId }: { plId: string }) {
  // Check for TEST_CERTIFICATE docs
  const { data: testCerts } = trpc.pl.getDocuments.useQuery({
    plId,
    page: 1,
    pageSize: 1,
    category: "TEST_CERTIFICATE",
  });

  // Check for INSPECTION_REPORT docs
  const { data: inspReports } = trpc.pl.getDocuments.useQuery({
    plId,
    page: 1,
    pageSize: 1,
    category: "INSPECTION_REPORT",
  });

  const hasTestCert = (testCerts?.totalCount ?? 0) > 0;
  const hasInspReport = (inspReports?.totalCount ?? 0) > 0;

  // If either type of inspection doc exists, no warning needed
  if (hasTestCert || hasInspReport) {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-orange-300/50 bg-orange-50 px-4 py-2.5 dark:border-orange-500/30 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
      <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
        No inspection certificate linked - CAT-A items require inspection documentation
      </p>
    </div>
  );
}
