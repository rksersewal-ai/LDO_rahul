"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MOCK_SETTINGS, type SystemSetting } from "@/lib/mock-data/admin";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([...MOCK_SETTINGS]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedGroups, setSavedGroups] = useState<Set<string>>(new Set());

  // Group settings by group field
  const groups = settings.reduce<Record<string, SystemSetting[]>>((acc, setting) => {
    if (!acc[setting.group]) {
      acc[setting.group] = [];
    }
    acc[setting.group].push(setting);
    return acc;
  }, {});

  const handleValueChange = (id: string, value: string) => {
    setEditedValues({ ...editedValues, [id]: value });
  };

  const handleSaveGroup = (group: string) => {
    const groupSettings = groups[group];
    const updated = settings.map((s) => {
      if (s.group === group && editedValues[s.id] !== undefined) {
        return { ...s, value: editedValues[s.id], updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSettings(updated);

    // Clear edited values for this group
    const newEdited = { ...editedValues };
    for (const s of groupSettings) {
      delete newEdited[s.id];
    }
    setEditedValues(newEdited);

    // Show saved indicator
    setSavedGroups(new Set([...savedGroups, group]));
    setTimeout(() => {
      setSavedGroups((prev) => {
        const next = new Set(prev);
        next.delete(group);
        return next;
      });
    }, 2000);
  };

  const hasChanges = (group: string) => {
    const groupSettings = groups[group];
    return groupSettings.some(
      (s) => editedValues[s.id] !== undefined && editedValues[s.id] !== s.value,
    );
  };

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="System Settings"
          subtitle="Configure system parameters, work types, and operational settings"
        />

        {Object.entries(groups).map(([group, groupSettings]) => (
          <section key={group} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{group}</h2>
                <Badge variant="outline" className="text-[10px] h-4">
                  {groupSettings.length} settings
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {savedGroups.has(group) && (
                  <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                    <Check className="h-2.5 w-2.5" />
                    Saved
                  </Badge>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={!hasChanges(group)}
                  onClick={() => handleSaveGroup(group)}
                >
                  <Save className="h-3 w-3" />
                  Save {group}
                </Button>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {groupSettings.map((setting) => (
                <SettingField
                  key={setting.id}
                  setting={setting}
                  value={editedValues[setting.id] ?? setting.value}
                  onChange={(v) => handleValueChange(setting.id, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: SystemSetting;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
      <div className="flex flex-col gap-1">
        <Label className="text-xs font-medium">{setting.label}</Label>
        <p className="text-[10px] text-muted-foreground">{setting.description}</p>
        <p className="text-[10px] text-muted-foreground">
          Last updated: {new Date(setting.updatedAt).toLocaleDateString("en-IN")} by{" "}
          {setting.updatedBy}
        </p>
      </div>
      <div className="w-64">
        {setting.type === "boolean" && (
          <div className="flex items-center justify-end">
            <Switch
              checked={value === "true"}
              onCheckedChange={(v) => onChange(v ? "true" : "false")}
            />
          </div>
        )}
        {setting.type === "number" && (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs"
          />
        )}
        {setting.type === "text" && (
          <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
        )}
        {setting.type === "select" && setting.options && (
          <Select value={value} onValueChange={(v) => onChange(v || value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {setting.type === "json" && (
          <textarea
            value={JSON.stringify(JSON.parse(value), null, 2)}
            onChange={(e) => {
              try {
                JSON.parse(e.target.value);
                onChange(e.target.value);
              } catch {
                onChange(e.target.value);
              }
            }}
            className="w-full h-24 rounded-md border bg-transparent px-3 py-2 text-[10px] font-mono resize-y"
          />
        )}
      </div>
    </div>
  );
}
