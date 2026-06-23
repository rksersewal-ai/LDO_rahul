"use client";

import { Edit, KeyRound, Lock, Plus, Shield, UserX } from "lucide-react";
import { useState } from "react";
import { AccountSecurityDialog } from "@/components/admin/account-security-dialog";
import { PasswordResetDialog } from "@/components/admin/password-reset-dialog";
import { UserForm, type UserFormValues } from "@/components/admin/user-form";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/lib/mock-data/users";
import { trpc } from "@/lib/trpc/client";

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "destructive",
  supervisor: "default",
  reviewer: "secondary",
  engineer: "secondary",
  viewer: "outline",
  classification_officer: "secondary",
  records_manager: "secondary",
  legal_hold_officer: "secondary",
  auditor: "outline",
};

export default function UserManagementPage() {
  const { data: usersData, refetch } = trpc.admin.getUsers.useQuery(undefined, {
    staleTime: 15_000,
  });

  const users = (usersData ?? []) as Array<Record<string, unknown>>;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Record<string, unknown> | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<{
    id: string;
    name: string;
    username: string;
  } | null>(null);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [securityUser, setSecurityUser] = useState<Record<string, unknown> | null>(null);

  const filtered = users.filter((u) => {
    const name = (u.name as string) ?? "";
    const username = (u.username as string) ?? "";
    const email = (u.email as string) ?? "";
    const role = (u.role as string) ?? "";
    const isActive = u.isActive as boolean;
    if (
      search &&
      !name.toLowerCase().includes(search.toLowerCase()) &&
      !username.toLowerCase().includes(search.toLowerCase()) &&
      !email.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (roleFilter !== "all" && role !== roleFilter) return false;
    if (statusFilter === "active" && !isActive) return false;
    if (statusFilter === "inactive" && isActive) return false;
    return true;
  }) as Array<{
    id: string;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    designation: string;
    department: string;
    section: string;
    employeeId: string;
    phone: string;
    isActive: boolean;
    lastLogin: string | null;
    passwordChangedAt: string | null;
    forcePasswordChange: boolean;
    failedLoginAttempts: number;
    lockedAt: string | null;
    lockedBy: string | null;
    lockReason: string | null;
    createdAt: string;
  }>;

  const createUserMutation = trpc.admin.createUser.useMutation({ onSuccess: () => refetch() });
  const updateUserMutation = trpc.admin.updateUser.useMutation({ onSuccess: () => refetch() });

  const handleCreate = (values: UserFormValues) => {
    if (!values.password) return; // password is required on creation; schema enforces min-length
    createUserMutation.mutate({
      username: values.username,
      email: values.email,
      name: values.name,
      password: values.password,
      role: values.role as "admin" | "supervisor" | "reviewer" | "engineer" | "viewer",
      designation: values.designation,
      department: values.department,
      section: values.section,
      employeeId: values.employeeId,
      phone: values.phone,
    });
    setDialogOpen(false);
  };

  const handleEdit = (values: UserFormValues) => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.id as string,
      name: values.name,
      email: values.email,
      role: values.role as "admin" | "supervisor" | "reviewer" | "engineer" | "viewer",
      designation: values.designation,
      department: values.department,
      phone: values.phone,
    });
    setEditingUser(null);
    setDialogOpen(false);
  };

  const handleDeactivate = (id: string) => {
    updateUserMutation.mutate({ id, isActive: false });
  };

  const openEditDialog = (user: Record<string, unknown>) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  // Password reset handlers
  const openPasswordReset = (user: Record<string, unknown>) => {
    setPasswordResetUser({
      id: user.id as string,
      name: user.name as string,
      username: user.username as string,
    });
    setPasswordResetOpen(true);
  };

  const handlePasswordReset = (_userId: string, _newPassword: string, _forceChange: boolean) => {
    // Password reset should call admin.resetPassword mutation
    refetch();
  };

  // Security dialog handlers
  const openSecurityDialog = (user: Record<string, unknown>) => {
    setSecurityUser(user);
    setSecurityDialogOpen(true);
  };

  const handleLockAccount = (_userId: string, _reason: string) => {
    // Would call admin.lockUser mutation
    refetch();
    setSecurityDialogOpen(false);
  };

  const handleUnlockAccount = (_userId: string) => {
    // Would call admin.unlockUser mutation
    refetch();
    setSecurityDialogOpen(false);
  };

  const handleForcePasswordChange = (_userId: string) => {
    refetch();
  };

  const handleClearFailedAttempts = (_userId: string) => {
    refetch();
  };

  return (
    <PageFrame size="xl">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="User Management"
          subtitle="Manage user accounts, roles, and access permissions"
          actions={
            <Button size="sm" className="h-7 text-xs gap-1" onClick={openCreateDialog}>
              <Plus className="h-3 w-3" />
              Create User
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs w-64"
          />
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "all")}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="reviewer">Reviewer</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px] h-5 ml-auto">
            {filtered.length} users
          </Badge>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Name</TableHead>
                <TableHead className="text-[11px]">Username</TableHead>
                <TableHead className="text-[11px]">Email</TableHead>
                <TableHead className="text-[11px]">Role</TableHead>
                <TableHead className="text-[11px]">Department</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Security</TableHead>
                <TableHead className="text-[11px]">Last Login</TableHead>
                <TableHead className="text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-xs font-medium">{user.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.username}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={roleBadgeVariant[user.role]}
                      className="text-[10px] h-4 capitalize"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{user.department}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "secondary" : "outline"}
                      className="text-[10px] h-4"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lockedAt ? (
                      <Badge variant="destructive" className="text-[10px] h-4">
                        Locked
                      </Badge>
                    ) : user.forcePasswordChange ? (
                      <Badge className="text-[10px] h-4 bg-amber-500/10 text-amber-600 border-amber-200">
                        Force Change
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] h-4 text-green-700">
                        Normal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => openPasswordReset(user)}
                        title="Reset Password"
                      >
                        <KeyRound className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => openSecurityDialog(user)}
                        title={user.lockedAt ? "Unlock Account" : "Account Security"}
                      >
                        {user.lockedAt ? (
                          <Lock className="h-3 w-3 text-destructive" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {user.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* User Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
            </DialogHeader>
            <UserForm
              isEdit={!!editingUser}
              defaultValues={
                editingUser
                  ? ({
                      username: editingUser.username as string,
                      email: editingUser.email as string,
                      name: editingUser.name as string,
                      role: editingUser.role as string,
                      designation: editingUser.designation as string,
                      department: editingUser.department as string,
                      section: editingUser.section as string,
                      employeeId: editingUser.employeeId as string,
                      phone: editingUser.phone as string,
                      isActive: editingUser.isActive as boolean,
                    } as Record<string, unknown> as Parameters<typeof UserForm>[0]["defaultValues"])
                  : undefined
              }
              onSubmit={editingUser ? handleEdit : handleCreate}
              onCancel={() => {
                setDialogOpen(false);
                setEditingUser(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <PasswordResetDialog
          open={passwordResetOpen}
          onOpenChange={setPasswordResetOpen}
          user={passwordResetUser}
          onReset={handlePasswordReset}
        />

        {/* Account Security Dialog */}
        <AccountSecurityDialog
          open={securityDialogOpen}
          onOpenChange={setSecurityDialogOpen}
          user={securityUser as never}
          onLockAccount={handleLockAccount}
          onUnlockAccount={handleUnlockAccount}
          onForcePasswordChange={handleForcePasswordChange}
          onClearFailedAttempts={handleClearFailedAttempts}
        />
      </div>
    </PageFrame>
  );
}
