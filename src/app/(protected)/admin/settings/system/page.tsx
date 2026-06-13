"use client";

import { Pencil, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface SystemSetting {
  key: string;
  label: string;
  defaultValue: string;
  dataType: "string" | "number" | "boolean";
}

const SYSTEM_SETTINGS: SystemSetting[] = [
  {
    key: "security.login.maxFailedAttempts",
    label: "Max Failed Login Attempts",
    defaultValue: "5",
    dataType: "number",
  },
  {
    key: "security.session.maxMinutes",
    label: "Session Timeout (minutes)",
    defaultValue: "60",
    dataType: "number",
  },
  {
    key: "documents.ocr.autoRun",
    label: "Auto-run OCR on Upload",
    defaultValue: "true",
    dataType: "boolean",
  },
  {
    key: "documents.pl.mod11Required",
    label: "PL Number Mod-11 Check Required",
    defaultValue: "false",
    dataType: "boolean",
  },
  {
    key: "documents.share.defaultExpiryHours",
    label: "Share Link Default Expiry (hours)",
    defaultValue: "72",
    dataType: "number",
  },
  {
    key: "approvals.defaultDueDays",
    label: "Approval Default Due Days",
    defaultValue: "3",
    dataType: "number",
  },
  {
    key: "notifications.email.enabled",
    label: "Email Notifications Enabled",
    defaultValue: "true",
    dataType: "boolean",
  },
];

export default function SystemSettingsPage() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const setSetting = trpc.settings.set.useMutation();
  const resetSetting = trpc.settings.reset.useMutation();

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.defaultValue);
  };

  const handleSave = async (setting: SystemSetting) => {
    setSaving(true);
    await setSetting.mutateAsync({
      key: setting.key,
      value: editValue,
      scope: "system",
      dataType: setting.dataType,
    });
    setSaving(false);
    setEditingKey(null);
    setLastSaved(setting.key);
    setTimeout(() => setLastSaved(null), 3000);
  };

  const handleReset = async (setting: SystemSetting) => {
    await resetSetting.mutateAsync({
      key: setting.key,
      scope: "system",
    });
    setLastSaved(setting.key);
    setTimeout(() => setLastSaved(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure system-wide default values. These apply to all users unless overridden at a
          lower scope.
        </p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Setting</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Default Value</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {SYSTEM_SETTINGS.map((setting) => (
              <tr key={setting.key} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div>
                    <p className="text-xs font-medium">{setting.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{setting.key}</p>
                  </div>
                </td>
                <td className="p-3">
                  {editingKey === setting.key ? (
                    <div className="flex items-center gap-2">
                      {setting.dataType === "boolean" ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 rounded-md border bg-background px-2 text-xs"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type={setting.dataType === "number" ? "number" : "text"}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-24 rounded-md border bg-background px-2 text-xs"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleSave(setting)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
                        className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-mono">
                      {setting.defaultValue}
                      {lastSaved === setting.key && (
                        <span className="ml-2 text-green-600 dark:text-green-400 text-[10px]">
                          Updated
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {editingKey !== setting.key && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(setting)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReset(setting)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
