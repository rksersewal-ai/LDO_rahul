import { PageFrame } from "@/components/layout/page-frame";

export default function DashboardPage() {
  return (
    <PageFrame>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to LDO-2 Engineering Document Management System. KPI cards and charts will appear
          here.
        </p>
      </div>
    </PageFrame>
  );
}
