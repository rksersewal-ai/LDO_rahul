"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to change password");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm ring-1 ring-foreground/10">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Change Password</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            You are required to change your password before continuing.
          </p>
        </div>

        {success ? (
          <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-3 text-sm text-green-700 dark:text-green-400 text-center">
            Password changed successfully. Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="text-xs font-medium text-foreground">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={changePasswordMutation.isPending}
                className="mt-1 flex h-[34px] w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="text-xs font-medium text-foreground">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={changePasswordMutation.isPending}
                className="mt-1 flex h-[34px] w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={changePasswordMutation.isPending}
                className="mt-1 flex h-[34px] w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex h-[34px] w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Changing password...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
