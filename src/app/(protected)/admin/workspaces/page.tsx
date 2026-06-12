"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

interface Workspace {
  id: string;
  name: string;
  code: string;
  description: string | null;
  orgId: string;
  orgName: string | null;
  isActive: boolean;
  storageQuotaGb: number;
  usedStorageBytes: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}

const columns: ColumnDef<Workspace, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground">{row.getValue("code")}</span>
    ),
  },
  {
    accessorKey: "orgName",
    header: "Organization",
    cell: ({ row }) => <span className="text-xs">{row.getValue("orgName") ?? "N/A"}</span>,
  },
  {
    accessorKey: "storageQuotaGb",
    header: "Storage Quota",
    cell: ({ row }) => <span className="text-xs">{row.getValue("storageQuotaGb")} GB</span>,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("isActive") ? "secondary" : "outline"}
        className="text-[10px] h-4"
      >
        {row.getValue("isActive") ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.getValue("createdAt") as string).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
];

export default function WorkspacesAdminPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    orgId: "",
    storageQuotaGb: 100,
  });

  const workspacesQuery = trpc.admin.getWorkspaces.useQuery();
  const orgsQuery = trpc.admin.getOrganizations.useQuery();
  const createMutation = trpc.admin.createWorkspace.useMutation({
    onSuccess: () => {
      workspacesQuery.refetch();
      setDialogOpen(false);
      setFormData({ name: "", code: "", description: "", orgId: "", storageQuotaGb: 100 });
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.code || !formData.orgId) return;
    createMutation.mutate({
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      orgId: formData.orgId,
      storageQuotaGb: formData.storageQuotaGb,
    });
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Workspace Management"
          subtitle="Manage workspaces and their configurations"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3 w-3" />
              Create Workspace
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={(workspacesQuery.data as Workspace[] | undefined) ?? []}
          pageSize={20}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Create New Workspace</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Workspace name"
                />
              </div>
              <div>
                <Label className="text-xs">Code</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="WS-001"
                />
              </div>
              <div>
                <Label className="text-xs">Organization</Label>
                <select
                  className="mt-1 flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.orgId}
                  onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                >
                  <option value="">Select organization...</option>
                  {orgsQuery.data?.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Storage Quota (GB)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  value={formData.storageQuotaGb}
                  onChange={(e) =>
                    setFormData({ ...formData, storageQuotaGb: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  className="text-xs mt-1"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageFrame>
  );
}
