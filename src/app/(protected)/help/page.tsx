"use client";

import {
  BookOpen,
  Command,
  FileText,
  Keyboard,
  LifeBuoy,
  Mail,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const keyboardShortcuts = [
  { keys: ["Ctrl", "K"], description: "Open global search" },
  { keys: ["Ctrl", "N"], description: "Create new document" },
  { keys: ["Ctrl", "Shift", "D"], description: "Go to Dashboard" },
  { keys: ["Ctrl", "Shift", "A"], description: "Go to Approvals" },
  { keys: ["Ctrl", "Shift", "L"], description: "Go to Work Ledger" },
  { keys: ["Escape"], description: "Close modal / cancel action" },
  { keys: ["?"], description: "Show keyboard shortcuts (from any page)" },
];

const quickLinks = [
  {
    title: "Getting Started",
    description: "Learn the basics of LDO-2 EDMS and how to navigate the system.",
    icon: BookOpen,
    href: "#getting-started",
  },
  {
    title: "Document Management",
    description: "Upload, version, and organize documents using cabinets and tags.",
    icon: FileText,
    href: "#document-management",
  },
  {
    title: "Search & Filters",
    description: "Use full-text search, advanced filters, and saved queries.",
    icon: Search,
    href: "#search",
  },
  {
    title: "Approvals & Workflows",
    description: "Manage approval chains, delegate, and track review progress.",
    icon: LifeBuoy,
    href: "#approvals",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Help Center"
        subtitle="Guides, keyboard shortcuts, and support resources for LDO-2 EDMS."
      />

      {/* Quick Links */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card key={link.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{link.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{link.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Keyboard Shortcuts
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {keyboardShortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex items-center justify-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground min-w-[24px]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* System Information */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Command className="h-4 w-4" />
          System Information
        </h2>
        <Card>
          <CardContent className="p-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Application</dt>
                <dd className="mt-0.5 font-medium">LDO-2 EDMS v3</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Platform</dt>
                <dd className="mt-0.5 font-medium">Next.js 16 + tRPC</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Database</dt>
                <dd className="mt-0.5 font-medium">PostgreSQL + Drizzle ORM</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">OCR Engine</dt>
                <dd className="mt-0.5 font-medium">Tesseract 5.x</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      {/* Contact / Support */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Support
        </h2>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              For issues or feature requests, contact your system administrator or reach out to the
              development team. Include relevant document IDs, error messages, and steps to reproduce
              when reporting issues.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
