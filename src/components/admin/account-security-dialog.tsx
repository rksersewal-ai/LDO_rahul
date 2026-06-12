"use client";

import { AlertTriangle, Lock, Shield, ShieldCheck, Unlock, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MockUser } from "@/lib/mock-data/users";

interface AccountSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MockUser | null;
  onLockAccount: (userId: string, reason: string) => void;
  onUnlockAccount: (userId: string) => void;
  onForcePasswordChange: (userId: string) => void;
  onClearFailedAttempts: (userId: string) => void;
}

export function AccountSecurityDialog({
  open,
  onOpenChange,
  user,
  onLockAccount,
  onUnlockAccount,
  onForcePasswordChange,
  onClearFailedAttempts,
}: AccountSecurityDialogProps) {
  const [lockReason, setLockReason] = useState("");
  const [showLockInput, setShowLockInput] = useState(false);

  const handleClose = (val: boolean) => {
    if (!val) {
      setLockReason("");
      setShowLockInput(false);
    }
    onOpenChange(val);
  };

  const handleLock = () => {
    if (!user || !lockReason.trim()) return;
    onLockAccount(user.id, lockReason.trim());
    setLockReason("");
    setShowLockInput(false);
  };

  if (!user) return null;

  const isLocked = !!user.lockedAt;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account Security
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* User header */}
          <div className="rounded-md border p-3 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">@{user.username}</p>
            </div>
            {isLocked ? (
              <Badge variant="destructive" className="text-[10px] h-4">
                Locked
              </Badge>
            ) : user.forcePasswordChange ? (
              <Badge className="text-[10px] h-4 bg-amber-500/10 text-amber-600 border-amber-200">
                Force Change
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] h-4">
                Normal
              </Badge>
            )}
          </div>

          {/* Security info */}
          <div className="rounded-md border divide-y">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Last Password Change</span>
              <span className="text-xs font-medium">
                {user.passwordChangedAt
                  ? new Date(user.passwordChangedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Failed Login Attempts</span>
              <span
                className={`text-xs font-medium ${user.failedLoginAttempts > 0 ? "text-amber-600" : ""}`}
              >
                {user.failedLoginAttempts}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Lock Status</span>
              <span className="text-xs font-medium">
                {isLocked ? (
                  <span className="text-destructive">Locked</span>
                ) : (
                  <span className="text-green-600">Unlocked</span>
                )}
              </span>
            </div>
            {isLocked && (
              <>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Locked At</span>
                  <span className="text-xs">
                    {user.lockedAt
                      ? new Date(user.lockedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Lock Reason</span>
                  <span className="text-xs text-destructive max-w-[200px] text-right">
                    {user.lockReason || "-"}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Force Password Change</span>
              <span className="text-xs font-medium">
                {user.forcePasswordChange ? (
                  <span className="text-amber-600">Yes</span>
                ) : (
                  <span>No</span>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Actions
            </p>

            {isLocked ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 justify-start"
                onClick={() => {
                  onUnlockAccount(user.id);
                }}
              >
                <Unlock className="h-3 w-3 text-green-600" />
                Unlock Account
              </Button>
            ) : !showLockInput ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 justify-start text-destructive"
                onClick={() => setShowLockInput(true)}
              >
                <Lock className="h-3 w-3" />
                Lock Account
              </Button>
            ) : (
              <div className="flex flex-col gap-2 rounded-md border p-2 bg-destructive/5">
                <Label className="text-[11px] text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Lock Reason (required)
                </Label>
                <Input
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="h-7 text-xs"
                  placeholder="Reason for locking account..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 text-[11px]"
                    disabled={!lockReason.trim()}
                    onClick={handleLock}
                  >
                    Confirm Lock
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() => {
                      setShowLockInput(false);
                      setLockReason("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {!user.forcePasswordChange && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 justify-start"
                onClick={() => onForcePasswordChange(user.id)}
              >
                <ShieldCheck className="h-3 w-3 text-amber-600" />
                Force Password Change
              </Button>
            )}

            {user.failedLoginAttempts > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 justify-start"
                onClick={() => onClearFailedAttempts(user.id)}
              >
                <X className="h-3 w-3 text-muted-foreground" />
                Clear Failed Attempts ({user.failedLoginAttempts})
              </Button>
            )}
          </div>

          {/* Close */}
          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleClose(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
