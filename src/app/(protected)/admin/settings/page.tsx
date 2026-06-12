"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileUp,
  Lock,
  RefreshCw,
  Save,
  Settings2,
  Shield,
  ToggleLeft,
  Upload,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import type { Permission } from "@/lib/auth/permissions";
import {
  type ComplianceSettings,
  type FeatureToggle,
  MOCK_COMPLIANCE_SETTINGS,
  MOCK_FEATURE_TOGGLES,
  MOCK_ROLE_PERMISSIONS,
  MOCK_SECURITY_POLICIES,
  MOCK_SYSTEM_CONFIGURATION,
  type RolePermissionMatrix,
  type SecurityPolicies,
  type SystemConfiguration,
} from "@/lib/mock-data/admin-settings";
import type { UserRole } from "@/lib/mock-data/users";

type TabId =
  | "overview"
  | "features"
  | "security"
  | "roles"
  | "system"
  | "compliance"
  | "import-export";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Settings2 className="h-3.5 w-3.5" /> },
  { id: "features", label: "Feature Toggles", icon: <ToggleLeft className="h-3.5 w-3.5" /> },
  { id: "security", label: "Security", icon: <Lock className="h-3.5 w-3.5" /> },
  { id: "roles", label: "Roles & Permissions", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "system", label: "System", icon: <Settings2 className="h-3.5 w-3.5" /> },
  { id: "compliance", label: "Compliance", icon: <Shield className="h-3.5 w-3.5" /> },
  { id: "import-export", label: "Import/Export", icon: <Download className="h-3.5 w-3.5" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [features, setFeatures] = useState<FeatureToggle[]>([...MOCK_FEATURE_TOGGLES]);
  const [security, setSecurity] = useState<SecurityPolicies>({ ...MOCK_SECURITY_POLICIES });
  const [rolePerms, setRolePerms] = useState<RolePermissionMatrix>({ ...MOCK_ROLE_PERMISSIONS });
  const [sysConfig, setSysConfig] = useState<SystemConfiguration>({
    ...MOCK_SYSTEM_CONFIGURATION,
  });
  const [compliance, setCompliance] = useState<ComplianceSettings>({
    ...MOCK_COMPLIANCE_SETTINGS,
  });

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="System Settings"
          subtitle="Comprehensive administration control center"
        />

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b overflow-x-auto pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#d38738] text-[#d38738]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "overview" && (
            <OverviewTab
              features={features}
              setFeatures={setFeatures}
              security={security}
              compliance={compliance}
              sysConfig={sysConfig}
              rolePerms={rolePerms}
            />
          )}
          {activeTab === "features" && (
            <FeatureTogglesTab features={features} setFeatures={setFeatures} />
          )}
          {activeTab === "security" && (
            <SecurityTab security={security} setSecurity={setSecurity} />
          )}
          {activeTab === "roles" && <RolesTab rolePerms={rolePerms} setRolePerms={setRolePerms} />}
          {activeTab === "system" && (
            <SystemTab sysConfig={sysConfig} setSysConfig={setSysConfig} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab compliance={compliance} setCompliance={setCompliance} />
          )}
          {activeTab === "import-export" && (
            <ImportExportTab
              features={features}
              security={security}
              rolePerms={rolePerms}
              sysConfig={sysConfig}
              compliance={compliance}
              setFeatures={setFeatures}
              setSecurity={setSecurity}
              setRolePerms={setRolePerms}
              setSysConfig={setSysConfig}
              setCompliance={setCompliance}
            />
          )}
        </div>
      </div>
    </PageFrame>
  );
}

// ============ Overview Tab ============
function OverviewTab({
  features,
  setFeatures,
  security,
  compliance,
  sysConfig,
  rolePerms,
}: {
  features: FeatureToggle[];
  setFeatures: (f: FeatureToggle[]) => void;
  security: SecurityPolicies;
  compliance: ComplianceSettings;
  sysConfig: SystemConfiguration;
  rolePerms: RolePermissionMatrix;
}) {
  const enabledCount = features.filter((f) => f.enabled).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-[#d38738]" />
            Feature Toggles
          </CardTitle>
          <CardDescription className="text-[10px]">
            {enabledCount} of {features.length} features enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {features.slice(0, 4).map((ft) => (
            <div key={ft.id} className="flex items-center justify-between">
              <span className="text-[11px]">{ft.name}</span>
              <Switch
                checked={ft.enabled}
                onCheckedChange={(checked) => {
                  setFeatures(
                    features.map((f) =>
                      f.id === ft.id
                        ? { ...f, enabled: checked, lastModified: new Date().toISOString() }
                        : f,
                    ),
                  );
                }}
                className="scale-75"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#d38738]" />
            Security Status
          </CardTitle>
          <CardDescription className="text-[10px]">Current security posture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Password min length</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {security.password.minLength} chars
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">2FA Enabled</span>
            <Badge
              variant={security.login.twoFactorEnabled ? "default" : "secondary"}
              className="text-[10px] h-4"
            >
              {security.login.twoFactorEnabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Session timeout</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {security.session.timeoutMinutes} min
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">IP Restrictions</span>
            <Badge
              variant={security.ipRestrictions.enabled ? "default" : "secondary"}
              className="text-[10px] h-4"
            >
              {security.ipRestrictions.enabled ? "Active" : "Off"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#d38738]" />
            Compliance
          </CardTitle>
          <CardDescription className="text-[10px]">Audit & approval configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Audit retention</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {compliance.auditRetention.retentionPeriod.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Required approvers</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {compliance.approvalWorkflow.requiredApprovers}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Max revisions</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {compliance.versionControl.maxRevisionsToKeep}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Auto-escalation</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {compliance.approvalWorkflow.autoEscalationDays} days
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#d38738]" />
            Upload & Storage
          </CardTitle>
          <CardDescription className="text-[10px]">File handling configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Max file size</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {sysConfig.upload.maxFileSizeMB} MB
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Auto-archive</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {sysConfig.storage.autoArchiveAfterDays} days
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Retention policy</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {sysConfig.storage.retentionPolicy.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Compression</span>
            <Badge
              variant={sysConfig.storage.compressionEnabled ? "default" : "secondary"}
              className="text-[10px] h-4"
            >
              {sysConfig.storage.compressionEnabled ? "On" : "Off"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-[#d38738]" />
            Roles Summary
          </CardTitle>
          <CardDescription className="text-[10px]">Permission distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(["admin", "supervisor", "reviewer", "engineer", "viewer"] as UserRole[]).map((role) => (
            <div key={role} className="flex items-center justify-between">
              <span className="text-[11px] capitalize">{role}</span>
              <Badge variant="outline" className="text-[10px] h-4">
                {rolePerms[role].length}/{ALL_PERMISSIONS.length} perms
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#d38738]" />
            OCR Engine
          </CardTitle>
          <CardDescription className="text-[10px]">OCR processing status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Enabled</span>
            <Badge
              variant={sysConfig.ocr.enabled ? "default" : "secondary"}
              className="text-[10px] h-4"
            >
              {sysConfig.ocr.enabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Confidence threshold</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {sysConfig.ocr.confidenceThreshold}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Max workers</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {sysConfig.ocr.maxWorkers}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Auto-retry</span>
            <Badge
              variant={sysConfig.ocr.autoRetryOnFailure ? "default" : "secondary"}
              className="text-[10px] h-4"
            >
              {sysConfig.ocr.autoRetryOnFailure ? "On" : "Off"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Feature Toggles Tab ============
function FeatureTogglesTab({
  features,
  setFeatures,
}: {
  features: FeatureToggle[];
  setFeatures: (f: FeatureToggle[]) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleToggle = (id: string, enabled: boolean) => {
    setFeatures(
      features.map((f) =>
        f.id === id
          ? { ...f, enabled, lastModified: new Date().toISOString(), modifiedBy: "Admin" }
          : f,
      ),
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Application Features</h2>
          <p className="text-[10px] text-muted-foreground">
            Enable or disable features across the application
          </p>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
          {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-2">
        {features.map((ft) => (
          <div
            key={ft.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{ft.name}</span>
                <Badge variant={ft.enabled ? "default" : "secondary"} className="text-[9px] h-4">
                  {ft.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{ft.description}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Last modified: {new Date(ft.lastModified).toLocaleDateString("en-IN")} by{" "}
                {ft.modifiedBy}
              </p>
            </div>
            <Switch
              checked={ft.enabled}
              onCheckedChange={(checked) => handleToggle(ft.id, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Security Tab ============
function SecurityTab({
  security,
  setSecurity,
}: {
  security: SecurityPolicies;
  setSecurity: (s: SecurityPolicies) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Security Policies</h2>
          <p className="text-[10px] text-muted-foreground">
            Configure authentication, session, and access control policies
          </p>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
          {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Password Policy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Password Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">
                Minimum Length: {security.password.minLength} characters
              </Label>
              <Input
                type="range"
                min={6}
                max={32}
                value={security.password.minLength}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    password: { ...security.password, minLength: Number(e.target.value) },
                  })
                }
                className="h-6"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Complexity Requirements</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={security.password.requireUppercase}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        password: { ...security.password, requireUppercase: e.target.checked },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  Uppercase
                </label>
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={security.password.requireLowercase}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        password: { ...security.password, requireLowercase: e.target.checked },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  Lowercase
                </label>
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={security.password.requireNumbers}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        password: { ...security.password, requireNumbers: e.target.checked },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  Numbers
                </label>
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={security.password.requireSpecialChars}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        password: {
                          ...security.password,
                          requireSpecialChars: e.target.checked,
                        },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  Special Chars
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Expiry (days)</Label>
                <Input
                  type="number"
                  value={security.password.expiryDays}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      password: { ...security.password, expiryDays: Number(e.target.value) },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">History Count</Label>
                <Input
                  type="number"
                  value={security.password.historyCount}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      password: { ...security.password, historyCount: Number(e.target.value) },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Policy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Login Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Max Failed Attempts</Label>
              <Input
                type="number"
                value={security.login.maxFailedAttempts}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    login: { ...security.login, maxFailedAttempts: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Lockout Duration (minutes)</Label>
              <Input
                type="number"
                value={security.login.lockoutDurationMinutes}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    login: {
                      ...security.login,
                      lockoutDurationMinutes: Number(e.target.value),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Two-Factor Authentication</Label>
              <Switch
                checked={security.login.twoFactorEnabled}
                onCheckedChange={(checked) =>
                  setSecurity({
                    ...security,
                    login: { ...security.login, twoFactorEnabled: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Session Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Timeout (minutes)</Label>
              <Input
                type="number"
                value={security.session.timeoutMinutes}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    session: { ...security.session, timeoutMinutes: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Max Concurrent Sessions</Label>
              <Input
                type="number"
                value={security.session.maxConcurrentSessions}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    session: {
                      ...security.session,
                      maxConcurrentSessions: Number(e.target.value),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* IP Restrictions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">IP Restrictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Enable IP Whitelist</Label>
              <Switch
                checked={security.ipRestrictions.enabled}
                onCheckedChange={(checked) =>
                  setSecurity({
                    ...security,
                    ipRestrictions: { ...security.ipRestrictions, enabled: checked },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Whitelisted IPs (CIDR notation, one per line)</Label>
              <textarea
                value={security.ipRestrictions.whitelist.join("\n")}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    ipRestrictions: {
                      ...security.ipRestrictions,
                      whitelist: e.target.value.split("\n").filter((l) => l.trim()),
                    },
                  })
                }
                className="w-full h-20 rounded-md border bg-transparent px-3 py-2 text-[10px] font-mono resize-y"
                placeholder="10.0.0.0/8&#10;192.168.0.0/16"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ Roles & Permissions Tab ============
const ALL_PERMISSIONS: Permission[] = [
  "view_documents",
  "search",
  "download",
  "upload",
  "create_work_records",
  "create_pl",
  "edit_bom",
  "approve_documents",
  "verify_work",
  "manage_cases",
  "manage_users",
  "system_settings",
  "view_audit",
];

const ALL_ROLES: UserRole[] = ["admin", "supervisor", "reviewer", "engineer", "viewer"];

function RolesTab({
  rolePerms,
  setRolePerms,
}: {
  rolePerms: RolePermissionMatrix;
  setRolePerms: (r: RolePermissionMatrix) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleToggle = (role: UserRole, permission: Permission, granted: boolean) => {
    if (role === "admin") return; // admin always has all
    const updated = { ...rolePerms };
    if (granted) {
      if (!updated[role].includes(permission)) {
        updated[role] = [...updated[role], permission];
      }
    } else {
      updated[role] = updated[role].filter((p) => p !== permission);
    }
    setRolePerms(updated);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Role Permission Matrix</h2>
          <p className="text-[10px] text-muted-foreground">
            Configure which permissions each role has access to
          </p>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
          {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground min-w-[160px]">
                Permission
              </th>
              {ALL_ROLES.map((role) => (
                <th key={role} className="text-center p-2 font-medium capitalize min-w-[90px]">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((permission) => (
              <tr key={permission} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-2 font-medium">{permission.replace(/_/g, " ")}</td>
                {ALL_ROLES.map((role) => {
                  const hasIt = rolePerms[role]?.includes(permission);
                  const isAdmin = role === "admin";
                  return (
                    <td key={role} className="text-center p-2">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={hasIt}
                          disabled={isAdmin}
                          onChange={(e) => handleToggle(role, permission, e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-300 disabled:opacity-50"
                        />
                        {isAdmin && hasIt && (
                          <CheckCircle2 className="h-3 w-3 text-green-600 ml-0.5" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Note: Admin role has all permissions by default and cannot be modified.
      </p>
    </div>
  );
}

// ============ System Configuration Tab ============
function SystemTab({
  sysConfig,
  setSysConfig,
}: {
  sysConfig: SystemConfiguration;
  setSysConfig: (s: SystemConfiguration) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">System Configuration</h2>
          <p className="text-[10px] text-muted-foreground">
            Upload limits, OCR settings, notifications, and storage management
          </p>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
          {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload Configuration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Upload Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Max File Size (MB)</Label>
              <Input
                type="number"
                value={sysConfig.upload.maxFileSizeMB}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    upload: { ...sysConfig.upload, maxFileSizeMB: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Allowed Extensions (comma-separated)</Label>
              <Input
                value={sysConfig.upload.allowedExtensions.join(", ")}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    upload: {
                      ...sysConfig.upload,
                      allowedExtensions: e.target.value.split(",").map((s) => s.trim()),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Max Concurrent Uploads</Label>
              <Input
                type="number"
                value={sysConfig.upload.maxConcurrentUploads}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    upload: {
                      ...sysConfig.upload,
                      maxConcurrentUploads: Number(e.target.value),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* OCR Configuration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">OCR Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">OCR Enabled</Label>
              <Switch
                checked={sysConfig.ocr.enabled}
                onCheckedChange={(checked) =>
                  setSysConfig({
                    ...sysConfig,
                    ocr: { ...sysConfig.ocr, enabled: checked },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Confidence Threshold (%)</Label>
              <Input
                type="number"
                value={sysConfig.ocr.confidenceThreshold}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    ocr: { ...sysConfig.ocr, confidenceThreshold: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Max Workers</Label>
              <Input
                type="number"
                value={sysConfig.ocr.maxWorkers}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    ocr: { ...sysConfig.ocr, maxWorkers: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Auto-Retry on Failure</Label>
              <Switch
                checked={sysConfig.ocr.autoRetryOnFailure}
                onCheckedChange={(checked) =>
                  setSysConfig({
                    ...sysConfig,
                    ocr: { ...sysConfig.ocr, autoRetryOnFailure: checked },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Max Retries</Label>
              <Input
                type="number"
                value={sysConfig.ocr.maxRetries}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    ocr: { ...sysConfig.ocr, maxRetries: Number(e.target.value) },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Configuration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Notification Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Digest Frequency</Label>
              <Select
                value={sysConfig.notifications.digestFrequency}
                onValueChange={(v) =>
                  setSysConfig({
                    ...sysConfig,
                    notifications: {
                      ...sysConfig.notifications,
                      digestFrequency: v as "realtime" | "hourly" | "daily" | "weekly",
                    },
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Channels</Label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={sysConfig.notifications.channels.email}
                    onChange={(e) =>
                      setSysConfig({
                        ...sysConfig,
                        notifications: {
                          ...sysConfig.notifications,
                          channels: {
                            ...sysConfig.notifications.channels,
                            email: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  Email
                </label>
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={sysConfig.notifications.channels.inApp}
                    onChange={(e) =>
                      setSysConfig({
                        ...sysConfig,
                        notifications: {
                          ...sysConfig.notifications,
                          channels: {
                            ...sysConfig.notifications.channels,
                            inApp: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  In-App
                </label>
                <label className="flex items-center gap-1.5 text-[10px]">
                  <input
                    type="checkbox"
                    checked={sysConfig.notifications.channels.sms}
                    onChange={(e) =>
                      setSysConfig({
                        ...sysConfig,
                        notifications: {
                          ...sysConfig.notifications,
                          channels: {
                            ...sysConfig.notifications.channels,
                            sms: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded h-3 w-3"
                  />
                  SMS
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Quiet Hours Start</Label>
                <Input
                  type="time"
                  value={sysConfig.notifications.quietHoursStart}
                  onChange={(e) =>
                    setSysConfig({
                      ...sysConfig,
                      notifications: {
                        ...sysConfig.notifications,
                        quietHoursStart: e.target.value,
                      },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Quiet Hours End</Label>
                <Input
                  type="time"
                  value={sysConfig.notifications.quietHoursEnd}
                  onChange={(e) =>
                    setSysConfig({
                      ...sysConfig,
                      notifications: {
                        ...sysConfig.notifications,
                        quietHoursEnd: e.target.value,
                      },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Management */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Storage Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Auto-Archive After (days)</Label>
              <Input
                type="number"
                value={sysConfig.storage.autoArchiveAfterDays}
                onChange={(e) =>
                  setSysConfig({
                    ...sysConfig,
                    storage: {
                      ...sysConfig.storage,
                      autoArchiveAfterDays: Number(e.target.value),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Retention Policy</Label>
              <Select
                value={sysConfig.storage.retentionPolicy}
                onValueChange={(v) =>
                  setSysConfig({
                    ...sysConfig,
                    storage: {
                      ...sysConfig.storage,
                      retentionPolicy: v as "indefinite" | "5_years" | "10_years" | "20_years",
                    },
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                  <SelectItem value="5_years">5 Years</SelectItem>
                  <SelectItem value="10_years">10 Years</SelectItem>
                  <SelectItem value="20_years">20 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Compression Enabled</Label>
              <Switch
                checked={sysConfig.storage.compressionEnabled}
                onCheckedChange={(checked) =>
                  setSysConfig({
                    ...sysConfig,
                    storage: { ...sysConfig.storage, compressionEnabled: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ Compliance Tab ============
function ComplianceTab({
  compliance,
  setCompliance,
}: {
  compliance: ComplianceSettings;
  setCompliance: (c: ComplianceSettings) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Compliance Settings</h2>
          <p className="text-[10px] text-muted-foreground">
            Audit retention, approval workflows, and version control policies
          </p>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
          {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audit Retention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Audit Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Retention Period</Label>
              <Select
                value={compliance.auditRetention.retentionPeriod}
                onValueChange={(v) =>
                  setCompliance({
                    ...compliance,
                    auditRetention: {
                      ...compliance.auditRetention,
                      retentionPeriod: v as
                        | "1_year"
                        | "3_years"
                        | "5_years"
                        | "10_years"
                        | "indefinite",
                    },
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="3_years">3 Years</SelectItem>
                  <SelectItem value="5_years">5 Years</SelectItem>
                  <SelectItem value="10_years">10 Years</SelectItem>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Auto-Export Enabled</Label>
              <Switch
                checked={compliance.auditRetention.autoExportEnabled}
                onCheckedChange={(checked) =>
                  setCompliance({
                    ...compliance,
                    auditRetention: { ...compliance.auditRetention, autoExportEnabled: checked },
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Export Format</Label>
              <Select
                value={compliance.auditRetention.exportFormat}
                onValueChange={(v) =>
                  setCompliance({
                    ...compliance,
                    auditRetention: {
                      ...compliance.auditRetention,
                      exportFormat: v as "json" | "csv",
                    },
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Approval Workflow */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Document Approval Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Required Approvers</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={compliance.approvalWorkflow.requiredApprovers}
                onChange={(e) =>
                  setCompliance({
                    ...compliance,
                    approvalWorkflow: {
                      ...compliance.approvalWorkflow,
                      requiredApprovers: Number(e.target.value),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Auto-Escalation (days)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={compliance.approvalWorkflow.autoEscalationDays}
                onChange={(e) =>
                  setCompliance({
                    ...compliance,
                    approvalWorkflow: {
                      ...compliance.approvalWorkflow,
                      autoEscalationDays: Number(e.target.value),
                    },
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Allow Self-Approval</Label>
              <Switch
                checked={compliance.approvalWorkflow.allowSelfApproval}
                onCheckedChange={(checked) =>
                  setCompliance({
                    ...compliance,
                    approvalWorkflow: {
                      ...compliance.approvalWorkflow,
                      allowSelfApproval: checked,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Require Comments</Label>
              <Switch
                checked={compliance.approvalWorkflow.requireComments}
                onCheckedChange={(checked) =>
                  setCompliance({
                    ...compliance,
                    approvalWorkflow: {
                      ...compliance.approvalWorkflow,
                      requireComments: checked,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Version Control Policy */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Version Control Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px]">Max Revisions to Keep</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={compliance.versionControl.maxRevisionsToKeep}
                  onChange={(e) =>
                    setCompliance({
                      ...compliance,
                      versionControl: {
                        ...compliance.versionControl,
                        maxRevisionsToKeep: Number(e.target.value),
                      },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                <Label className="text-[10px]">Mandatory Comments</Label>
                <Switch
                  checked={compliance.versionControl.mandatoryCommentsOnRevision}
                  onCheckedChange={(checked) =>
                    setCompliance({
                      ...compliance,
                      versionControl: {
                        ...compliance.versionControl,
                        mandatoryCommentsOnRevision: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                <Label className="text-[10px]">Auto Version Increment</Label>
                <Switch
                  checked={compliance.versionControl.autoVersionIncrement}
                  onCheckedChange={(checked) =>
                    setCompliance({
                      ...compliance,
                      versionControl: {
                        ...compliance.versionControl,
                        autoVersionIncrement: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                <Label className="text-[10px]">Lock on Checkout</Label>
                <Switch
                  checked={compliance.versionControl.lockOnCheckout}
                  onCheckedChange={(checked) =>
                    setCompliance({
                      ...compliance,
                      versionControl: {
                        ...compliance.versionControl,
                        lockOnCheckout: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ Import/Export Tab ============
function ImportExportTab({
  features,
  security,
  rolePerms,
  sysConfig,
  compliance,
  setFeatures,
  setSecurity,
  setRolePerms,
  setSysConfig,
  setCompliance,
}: {
  features: FeatureToggle[];
  security: SecurityPolicies;
  rolePerms: RolePermissionMatrix;
  sysConfig: SystemConfiguration;
  compliance: ComplianceSettings;
  setFeatures: (f: FeatureToggle[]) => void;
  setSecurity: (s: SecurityPolicies) => void;
  setRolePerms: (r: RolePermissionMatrix) => void;
  setSysConfig: (s: SystemConfiguration) => void;
  setCompliance: (c: ComplianceSettings) => void;
}) {
  const [importPreview, setImportPreview] = useState<string | null>(null);
  const [importChanges, setImportChanges] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      featureToggles: features,
      securityPolicies: security,
      rolePermissions: rolePerms,
      systemConfiguration: sysConfig,
      complianceSettings: compliance,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ldo-settings-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        setImportPreview(text);
        const changes: string[] = [];
        if (parsed.featureToggles)
          changes.push(`Feature Toggles: ${parsed.featureToggles.length} items`);
        if (parsed.securityPolicies) changes.push("Security Policies: will be updated");
        if (parsed.rolePermissions) changes.push("Role Permissions: will be updated");
        if (parsed.systemConfiguration) changes.push("System Configuration: will be updated");
        if (parsed.complianceSettings) changes.push("Compliance Settings: will be updated");
        setImportChanges(changes);
      } catch {
        setImportPreview(null);
        setImportChanges(["Error: Invalid JSON file"]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importPreview) return;
    try {
      const parsed = JSON.parse(importPreview);
      if (parsed.featureToggles) setFeatures(parsed.featureToggles);
      if (parsed.securityPolicies) setSecurity(parsed.securityPolicies);
      if (parsed.rolePermissions) setRolePerms(parsed.rolePermissions);
      if (parsed.systemConfiguration) setSysConfig(parsed.systemConfiguration);
      if (parsed.complianceSettings) setCompliance(parsed.complianceSettings);
      setImportSuccess(true);
      setImportPreview(null);
      setImportChanges([]);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch {
      // Error handled
    }
  };

  const handleReset = () => {
    setFeatures([...MOCK_FEATURE_TOGGLES]);
    setSecurity({ ...MOCK_SECURITY_POLICIES });
    setRolePerms({ ...MOCK_ROLE_PERMISSIONS });
    setSysConfig({ ...MOCK_SYSTEM_CONFIGURATION });
    setCompliance({ ...MOCK_COMPLIANCE_SETTINGS });
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Import & Export Settings</h2>
        <p className="text-[10px] text-muted-foreground">
          Backup, restore, or transfer system configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Export */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Export Settings</CardTitle>
            <CardDescription className="text-[10px]">
              Download all settings as a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="h-8 text-xs gap-1.5 w-full" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export All Settings
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Import Settings</CardTitle>
            <CardDescription className="text-[10px]">
              Upload a JSON file to restore settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" />
              Select File
            </Button>
            {importChanges.length > 0 && (
              <div className="space-y-1 p-2 rounded border bg-muted/50">
                <p className="text-[10px] font-medium">Preview of changes:</p>
                {importChanges.map((change) => (
                  <p key={change} className="text-[10px] text-muted-foreground">
                    {change}
                  </p>
                ))}
                {importPreview && (
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1 mt-2 w-full"
                    onClick={handleImport}
                  >
                    <Check className="h-3 w-3" />
                    Apply Import
                  </Button>
                )}
              </div>
            )}
            {importSuccess && (
              <div className="flex items-center gap-1.5 p-2 rounded border border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[10px] text-green-700 dark:text-green-400">
                  Settings imported successfully
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Reset to Defaults</CardTitle>
            <CardDescription className="text-[10px]">
              Restore all settings to factory defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showResetConfirm ? (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1.5 w-full"
                onClick={() => setShowResetConfirm(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset All Settings
              </Button>
            ) : (
              <div className="space-y-2 p-2 rounded border border-red-200 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-[10px] font-medium text-red-700 dark:text-red-400">
                    This will reset ALL settings to defaults. This action cannot be undone.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs flex-1"
                    onClick={handleReset}
                  >
                    Confirm Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
