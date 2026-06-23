"use client";

import { AlertTriangle, Info, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Banner, BannerType } from "@/lib/mock-data/admin";
import { trpc } from "@/lib/trpc/client";

const typeConfig: Record<
  BannerType,
  { icon: typeof Info; color: string; badge: "default" | "secondary" | "destructive" }
> = {
  info: { icon: Info, color: "text-blue-600", badge: "secondary" },
  warning: { icon: AlertTriangle, color: "text-amber-600", badge: "default" },
  critical: { icon: XCircle, color: "text-red-600", badge: "destructive" },
};

export default function BannerManagementPage() {
  const { data: bannersData, refetch } = trpc.admin.getBanners.useQuery(undefined, {
    staleTime: 15_000,
  });
  const createBannerMutation = trpc.admin.createBanner.useMutation({ onSuccess: () => refetch() });
  const deleteBannerMutation = trpc.admin.deleteBanner.useMutation({ onSuccess: () => refetch() });

  const banners = (bannersData ?? []) as Banner[];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({
    message: "",
    type: "info" as BannerType,
    isActive: true,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const handleCreate = () => {
    createBannerMutation.mutate({
      message: newBanner.message,
      type: newBanner.type,
      isActive: newBanner.isActive,
      startDate: new Date(newBanner.startDate).toISOString(),
      endDate: newBanner.endDate ? new Date(newBanner.endDate).toISOString() : null,
    });
    setDialogOpen(false);
    setNewBanner({
      message: "",
      type: "info",
      isActive: true,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
  };

  const handleDelete = (id: string) => {
    deleteBannerMutation.mutate({ id });
  };

  const handleToggle = (id: string) => {
    // Toggle is not supported in current API - would need updateBanner procedure
    // For now this is a no-op until the backend is extended
    void id;
  };

  const activeBanners = banners.filter((b) => b.isActive);

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Banner Management"
          subtitle="Create and manage system-wide announcements"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3 w-3" />
              Create Banner
            </Button>
          }
        />

        {/* Active Banner Preview */}
        {activeBanners.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Active Banners Preview
            </h2>
            <div className="flex flex-col gap-2">
              {activeBanners.map((banner) => {
                const config = typeConfig[banner.type];
                const Icon = config.icon;
                return (
                  <div
                    key={`preview-${banner.id}`}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                      banner.type === "critical"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                        : banner.type === "warning"
                          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                          : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                    <p className="flex-1">{banner.message}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Banners Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Type</TableHead>
                <TableHead className="text-[11px]">Message</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Start</TableHead>
                <TableHead className="text-[11px]">End</TableHead>
                <TableHead className="text-[11px]">Created By</TableHead>
                <TableHead className="text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => {
                const config = typeConfig[banner.type];
                return (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <Badge variant={config.badge} className="text-[10px] h-4 capitalize">
                        {banner.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[300px] truncate">
                      {banner.message}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggle(banner.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(banner.startDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {banner.endDate
                        ? new Date(banner.endDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "Indefinite"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {banner.createdBy}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Create Banner Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Create System Banner</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Message</Label>
                <textarea
                  value={newBanner.message}
                  onChange={(e) => setNewBanner({ ...newBanner, message: e.target.value })}
                  placeholder="Enter banner message..."
                  className="w-full h-20 rounded-md border bg-transparent px-3 py-2 text-xs resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={newBanner.type}
                    onValueChange={(v) =>
                      setNewBanner({ ...newBanner, type: (v || "info") as BannerType })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Active</Label>
                  <div className="flex items-center h-8">
                    <Switch
                      checked={newBanner.isActive}
                      onCheckedChange={(v) => setNewBanner({ ...newBanner, isActive: v })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={newBanner.startDate}
                    onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">End Date (optional)</Label>
                  <Input
                    type="date"
                    value={newBanner.endDate}
                    onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={!newBanner.message.trim()}>
                  Create Banner
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageFrame>
  );
}
