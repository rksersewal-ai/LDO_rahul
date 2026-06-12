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
import { MOCK_ADMIN_USERS } from "@/lib/mock-data/admin";
import type { MockUser, UserRole } from "@/lib/mock-data/users";

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "destructive",
  supervisor: "default",
  reviewer: "secondary",
  engineer: "secondary",
  viewer: "outline",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<MockUser[]>([...MOCK_ADMIN_USERS]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<{
    id: string;
    name: string;
    username: string;
  } | null>(null);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [securityUser, setSecurityUser] = useState<MockUser | null>(null);

  const filtered = users.filter((u) => {
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.username.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "inactive" && u.isActive) return false;
    return true;
  });

  const handleCreate = (values: UserFormValues) => {
    const newUser: MockUser = {
      id: `u-${Date.now()}`,
      username: values.username,
      email: values.email,
      name: values.name,
      password: values.password || "password123",
      role: values.role,
      designation: values.designation,
      department: values.department,
      section: values.section,
      employeeId: values.employeeId,
      phone: values.phone,
      isActive: true,
      lastLogin: null,
      passwordChangedAt: new Date().toISOString(),
      forcePasswordChange: true,
      failedLoginAttempts: 0,
      lockedAt: null,
      lockedBy: null,
      lockReason: null,
    };
    setUsers([...users, newUser]);
    setDialogOpen(false);
  };

  const handleEdit = (values: UserFormValues) => {
    if (!editingUser) return;
    setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u)));
    setEditingUser(null);
    setDialogOpen(false);
  };

  const handleDeactivate = (id: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, isActive: false } : u)));
  };

  const openEditDialog = (user: MockUser) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  // Password reset handlers
  const openPasswordReset = (user: MockUser) => {
    setPasswordResetUser({ id: user.id, name: user.name, username: user.username });
    setPasswordResetOpen(true);
  };

  const handlePasswordReset = (userId: string, newPassword: string, forceChange: boolean) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: newPassword,
              passwordChangedAt: new Date().toISOString(),
              forcePasswordChange: forceChange,
            }
          : u,
      ),
    );
  };

  // Security dialog handlers
  const openSecurityDialog = (user: MockUser) => {
    setSecurityUser(user);
    setSecurityDialogOpen(true);
  };

  const handleLockAccount = (userId: string, reason: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              lockedAt: new Date().toISOString(),
              lockedBy: "current-admin",
              lockReason: reason,
            }
          : u,
      ),
    );
    setSecurityUser((prev) =>
      prev && prev.id === userId
        ? {
            ...prev,
            lockedAt: new Date().toISOString(),
            lockedBy: "current-admin",
            lockReason: reason,
          }
        : prev,
    );
  };

  const handleUnlockAccount = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, lockedAt: null, lockedBy: null, lockReason: null, failedLoginAttempts: 0 }
          : u,
      ),
    );
    setSecurityUser((prev) =>
      prev && prev.id === userId
        ? { ...prev, lockedAt: null, lockedBy: null, lockReason: null, failedLoginAttempts: 0 }
        : prev,
    );
  };

  const handleForcePasswordChange = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, forcePasswordChange: true } : u)),
    );
    setSecurityUser((prev) =>
      prev && prev.id === userId ? { ...prev, forcePasswordChange: true } : prev,
    );
  };

  const handleClearFailedAttempts = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, failedLoginAttempts: 0 } : u)));
    setSecurityUser((prev) =>
      prev && prev.id === userId ? { ...prev, failedLoginAttempts: 0 } : prev,
    );
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
                  ? {
                      username: editingUser.username,
                      email: editingUser.email,
                      name: editingUser.name,
                      role: editingUser.role,
                      designation: editingUser.designation,
                      department: editingUser.department,
                      section: editingUser.section,
                      employeeId: editingUser.employeeId,
                      phone: editingUser.phone,
                      isActive: editingUser.isActive,
                    }
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
          user={securityUser}
          onLockAccount={handleLockAccount}
          onUnlockAccount={handleUnlockAccount}
          onForcePasswordChange={handleForcePasswordChange}
          onClearFailedAttempts={handleClearFailedAttempts}
        />
      </div>
    </PageFrame>
  );
}
