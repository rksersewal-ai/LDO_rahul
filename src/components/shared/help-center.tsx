"use client";

import {
  ArrowLeft,
  Book,
  ExternalLink,
  Headphones,
  Keyboard,
  MessageCircle,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SHORTCUTS } from "@/components/shared/keyboard-shortcuts";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const releaseNotes = [
  {
    version: "1.2.0",
    date: "2024-12-15",
    changes: ["Added BOM Explorer module", "OCR pipeline integration", "Admin health dashboard"],
  },
  {
    version: "1.1.0",
    date: "2024-11-20",
    changes: ["Work Ledger with reports", "Advanced search with filters", "Notification center"],
  },
  {
    version: "1.0.0",
    date: "2024-10-01",
    changes: [
      "Initial release",
      "Document management core",
      "PL Knowledge Hub",
      "Approval workflows",
    ],
  },
];

const helpTopics = [
  { title: "Getting Started", description: "Learn the basics of LDO EDMS", icon: Book },
  { title: "Document Upload", description: "How to upload and categorize documents", icon: Book },
  { title: "PL Numbers", description: "Understanding the PL numbering system", icon: Book },
  { title: "Approval Workflows", description: "Setting up and managing approvals", icon: Book },
  { title: "Search Tips", description: "Advanced search operators and filters", icon: Search },
  { title: "BOM Management", description: "Bill of Materials structure and linking", icon: Book },
];

const TOPIC_CONTENT: Record<string, string> = {
  "Getting Started":
    "Welcome to LDO-2 EDMS. Start by navigating the sidebar to access Documents, PL Knowledge Hub, Work Ledger, and more. Use the search bar (Ctrl+K) for quick access to any document or PL number. Your dashboard shows pending approvals, recent activity, and key metrics.",
  "Document Upload":
    "To upload a document, navigate to Documents and click 'Upload'. Select files (PDF, DWG, DOC, etc.), assign metadata including PL number, category, and discipline. Documents go through an approval workflow before becoming active. OCR is automatically applied to extract text content.",
  "PL Numbers":
    "PL (Parts List) numbers are the primary organizational unit. Each PL represents a specific component or assembly. Format: CLW/EL/PL/XXXX/YYYY where XXXX is the category code and YYYY is the serial. Use the PL Knowledge Hub to browse, search, and manage PL entries.",
  "Approval Workflows":
    "Documents requiring approval follow: Draft -> Under Review -> Approved/Rejected. Approvers are assigned based on document category and discipline. Critical documents require DyCME approval. Use the Approvals page to review pending items.",
  "Search Tips":
    "Use Ctrl+K for global search. Supported operators: exact phrase with quotes, category: filter, discipline: filter, status: filter. The search indexes document titles, descriptions, PL numbers, and OCR-extracted text content.",
  "BOM Management":
    "The BOM (Bill of Materials) Explorer shows hierarchical product structures. Navigate products, assemblies, and parts. Each BOM entry links to PL numbers and associated documents. Use the tree view to explore parent-child relationships.",
};

type Tab = "guide" | "shortcuts" | "releases" | "support";

export function HelpCenter({ open, onOpenChange }: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState<Tab>("guide");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const filteredTopics = helpTopics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredShortcuts = SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keys.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmitReport = () => {
    if (!reportText.trim()) return;
    window.open(
      `mailto:it-support@ldo.railways.gov.in?subject=Issue+Report&body=${encodeURIComponent(reportText)}`,
      "_blank",
    );
    setReportSubmitted(true);
    setReportText("");
    toast.success("Report submitted. Check your email client to send.");
    setTimeout(() => setReportSubmitted(false), 3000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Help Center</SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b px-4">
          <TabButton
            active={activeTab === "guide"}
            onClick={() => {
              setActiveTab("guide");
              setSelectedTopic(null);
            }}
          >
            <Book className="size-3" />
            Guide
          </TabButton>
          <TabButton active={activeTab === "shortcuts"} onClick={() => setActiveTab("shortcuts")}>
            <Keyboard className="size-3" />
            Shortcuts
          </TabButton>
          <TabButton active={activeTab === "releases"} onClick={() => setActiveTab("releases")}>
            <ExternalLink className="size-3" />
            Releases
          </TabButton>
          <TabButton active={activeTab === "support"} onClick={() => setActiveTab("support")}>
            <Headphones className="size-3" />
            Support
          </TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "guide" && (
            <div className="space-y-2">
              {selectedTopic ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTopic(null)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <ArrowLeft className="size-3" />
                    Back to topics
                  </button>
                  <h4 className="text-sm font-semibold">{selectedTopic}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {TOPIC_CONTENT[selectedTopic] ?? "Content coming soon."}
                  </p>
                </div>
              ) : filteredTopics.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No topics found for &quot;{searchQuery}&quot;
                </p>
              ) : (
                filteredTopics.map((topic) => (
                  <button
                    key={topic.title}
                    type="button"
                    onClick={() => setSelectedTopic(topic.title)}
                    className="flex items-start gap-2.5 w-full rounded-lg border p-2.5 text-left hover:bg-accent/50 transition-colors"
                  >
                    <topic.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{topic.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {topic.description}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === "shortcuts" && (
            <div className="space-y-4">
              {(["general", "navigation", "actions"] as const).map((category) => {
                const items = filteredShortcuts.filter((s) => s.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category}>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {category}
                    </h4>
                    <div className="space-y-0.5">
                      {items.map((shortcut) => (
                        <div
                          key={shortcut.keys}
                          className="flex items-center justify-between py-1.5 px-1"
                        >
                          <span className="text-xs">{shortcut.description}</span>
                          <kbd className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                            {shortcut.keys}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "releases" && (
            <div className="space-y-4">
              {releaseNotes.map((release) => (
                <div key={release.version} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold">v{release.version}</span>
                    <span className="text-[10px] text-muted-foreground">{release.date}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {release.changes.map((change) => (
                      <li
                        key={change}
                        className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="mt-1.5 size-1 rounded-full bg-muted-foreground shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === "support" && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="size-4 text-muted-foreground" />
                  <h4 className="text-xs font-medium">Contact Support</h4>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  For technical issues or feature requests, contact the IT team.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">it-support@ldo.railways.gov.in</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">Ext. 2201</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours</span>
                    <span className="font-medium">Mon-Sat, 09:00-17:00</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="text-xs font-medium mb-2">Report an Issue</h4>
                <textarea
                  className="w-full h-20 rounded-md border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="Describe the issue you are facing..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={!reportText.trim()}
                  className={cn(
                    "mt-2 h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors",
                    !reportText.trim() && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {reportSubmitted ? "Submitted" : "Submit Report"}
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
