"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function UserPreferencesPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState("true");
  const [pushNotifications, setPushNotifications] = useState("true");

  // Display preferences
  const [theme, setTheme] = useState("system");
  const [defaultLandingPage, setDefaultLandingPage] = useState("dashboard");
  const [itemsPerPage, setItemsPerPage] = useState("20");

  const setUserPref = trpc.settings.setUserPreference.useMutation();

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const prefs = [
      { key: "notifications.email.enabled", value: emailNotifications },
      { key: "notifications.push.enabled", value: pushNotifications },
      { key: "display.theme", value: theme },
      { key: "display.defaultLandingPage", value: defaultLandingPage },
      { key: "display.itemsPerPage", value: itemsPerPage },
    ];

    try {
      await Promise.all(prefs.map((pref) => setUserPref.mutateAsync(pref)));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">User Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal notification and display settings.
        </p>
      </div>

      {/* Notification Preferences */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium border-b pb-2">Notification Preferences</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" htmlFor="email-notifs">
                Email Notifications
              </label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email for approvals and assignments.
              </p>
            </div>
            <select
              id="email-notifs"
              value={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" htmlFor="push-notifs">
                Push Notifications
              </label>
              <p className="text-xs text-muted-foreground">
                Browser notifications for real-time updates.
              </p>
            </div>
            <select
              id="push-notifs"
              value={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </section>

      {/* Display Preferences */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium border-b pb-2">Display Preferences</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" htmlFor="theme-select">
                Theme
              </label>
              <p className="text-xs text-muted-foreground">Choose your preferred appearance.</p>
            </div>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" htmlFor="landing-page">
                Default Landing Page
              </label>
              <p className="text-xs text-muted-foreground">Page shown after login.</p>
            </div>
            <select
              id="landing-page"
              value={defaultLandingPage}
              onChange={(e) => setDefaultLandingPage(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="dashboard">Dashboard</option>
              <option value="documents">Documents</option>
              <option value="approvals">Approvals</option>
              <option value="work-ledger">Work Ledger</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" htmlFor="items-per-page">
                Items Per Page
              </label>
              <p className="text-xs text-muted-foreground">Number of items displayed in lists.</p>
            </div>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Preferences saved successfully.
          </span>
        )}
        {saveError && <span className="text-sm text-destructive">{saveError}</span>}
      </div>
    </div>
  );
}
