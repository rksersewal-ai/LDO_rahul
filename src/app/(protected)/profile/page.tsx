"use client";

import { Clock, KeyRound, Lock, Mail, Monitor, Moon, Phone, Shield, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MOCK_USERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 dark:text-red-400",
  supervisor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  reviewer: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  engineer: "bg-green-500/10 text-green-600 dark:text-green-400",
  viewer: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function ProfilePage() {
  const currentUser = MOCK_USERS[0];
  const { theme, setTheme } = useTheme();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [defaultView, setDefaultView] = useState("dashboard");
  const handleDefaultViewChange = (value: string | null) => {
    if (value) setDefaultView(value);
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    // Mock success
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <PageFrame size="md">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Profile"
          subtitle="View your account information and manage preferences"
        />

        {/* Personal Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your account details. Contact admin to update personal information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Full Name" value={currentUser.name} />
              <InfoField label="Employee ID" value={currentUser.employeeId} />
              <InfoField label="Designation" value={currentUser.designation} />
              <InfoField label="Department" value={currentUser.department} />
              <InfoField label="Section" value={currentUser.section} />
              <InfoField
                label="Role"
                value={
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] h-4 px-1.5", roleColors[currentUser.role])}
                  >
                    {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                  </Badge>
                }
              />
              <InfoField
                label="Email"
                value={currentUser.email}
                icon={<Mail className="size-3 text-muted-foreground" />}
              />
              <InfoField
                label="Phone"
                value={currentUser.phone}
                icon={<Phone className="size-3 text-muted-foreground" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card id="preferences">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="size-4" />
              Preferences
            </CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Theme</Label>
                <p className="text-[11px] text-muted-foreground">
                  Choose your preferred appearance
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                    theme === "light" && "bg-accent text-foreground",
                  )}
                >
                  <Sun className="size-3" />
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                    theme === "dark" && "bg-accent text-foreground",
                  )}
                >
                  <Moon className="size-3" />
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                    theme === "system" && "bg-accent text-foreground",
                  )}
                >
                  <Monitor className="size-3" />
                  System
                </button>
              </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Email Notifications</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Receive email for approvals and assignments
                  </p>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Push Notifications</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Browser notifications for real-time updates
                  </p>
                </div>
                <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
              </div>
            </div>

            <Separator />

            {/* Default View */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Default Landing Page</Label>
                <p className="text-[11px] text-muted-foreground">Page shown after login</p>
              </div>
              <Select value={defaultView} onValueChange={handleDefaultViewChange}>
                <SelectTrigger className="w-[160px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard" className="text-xs">
                    Dashboard
                  </SelectItem>
                  <SelectItem value="documents" className="text-xs">
                    Documents
                  </SelectItem>
                  <SelectItem value="approvals" className="text-xs">
                    Approvals
                  </SelectItem>
                  <SelectItem value="ledger" className="text-xs">
                    Work Ledger
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="Last Login"
                value={
                  currentUser.lastLogin
                    ? new Date(currentUser.lastLogin).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Never"
                }
                icon={<Clock className="size-3 text-muted-foreground" />}
              />
              <InfoField
                label="Current Session"
                value={new Date().toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                icon={<KeyRound className="size-3 text-muted-foreground" />}
              />
              <InfoField label="Role" value={currentUser.role} />
              <InfoField label="Account Status" value="Active" />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password. Minimum 8 characters required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Enter current"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Enter new"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Confirm new"
                />
              </div>
            </div>
            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            {passwordSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Password updated successfully.
              </p>
            )}
            <Button size="sm" onClick={handlePasswordChange}>
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium">{typeof value === "string" ? value : ""}</span>
        {typeof value !== "string" && value}
      </div>
    </div>
  );
}
