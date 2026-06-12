"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Landmark, Plus } from "lucide-react";
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

interface Organization {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const columns: ColumnDef<Organization, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
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
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.getValue("address") ?? "Not specified"}
      </span>
    ),
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

export default function OrganizationsAdminPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
  });

  const orgsQuery = trpc.admin.getOrganizations.useQuery();
  const createMutation = trpc.admin.createOrganization.useMutation({
    onSuccess: () => {
      orgsQuery.refetch();
      setDialogOpen(false);
      setFormData({ name: "", code: "", address: "" });
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.code) return;
    createMutation.mutate({
      name: formData.name,
      code: formData.code,
      address: formData.address || undefined,
    });
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Organization Management"
          subtitle="Manage organizations that own workspaces"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3 w-3" />
              Create Organization
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={(orgsQuery.data as Organization[] | undefined) ?? []}
          pageSize={20}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Create New Organization</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Organization name"
                />
              </div>
              <div>
                <Label className="text-xs">Code</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ORG-001"
                />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Textarea
                  className="text-xs mt-1"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Optional address"
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
