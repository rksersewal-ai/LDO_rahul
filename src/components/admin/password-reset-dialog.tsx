"use client";

import { KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string; username: string } | null;
  onReset: (userId: string, newPassword: string, forceChange: boolean) => void;
}

function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let password = "";
  // Use cryptographically secure random number generator instead of Math.random()
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomValues[i] % chars.length);
  }
  return password;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  user,
  onReset,
}: PasswordResetDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);

  const handleGenerate = () => {
    setNewPassword(generateRandomPassword());
  };

  const handleSubmit = () => {
    if (!user || newPassword.length < 6) return;
    onReset(user.id, newPassword, forceChange);
    setNewPassword("");
    setForceChange(true);
    onOpenChange(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setNewPassword("");
      setForceChange(true);
    }
    onOpenChange(val);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Reset Password
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* User info */}
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs font-medium">{user.name}</p>
            <p className="text-[11px] text-muted-foreground">@{user.username}</p>
          </div>

          {/* New password field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password" className="text-xs">
              New Password
            </Label>
            <div className="flex gap-2">
              <Input
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs flex-1 font-mono"
                placeholder="Min 6 characters"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 shrink-0"
                onClick={handleGenerate}
              >
                <RefreshCw className="h-3 w-3" />
                Generate
              </Button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-[10px] text-destructive">Password must be at least 6 characters</p>
            )}
          </div>

          {/* Force change toggle */}
          <div className="flex items-center gap-2">
            <Switch id="force-change" checked={forceChange} onCheckedChange={setForceChange} />
            <Label htmlFor="force-change" className="text-xs">
              Force password change on next login
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={newPassword.length < 6}
              onClick={handleSubmit}
            >
              Reset Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
