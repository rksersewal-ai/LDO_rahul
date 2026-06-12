"use client";

import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  Info,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data/work-records";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";

const CURRENT_USER_ID = "user-001";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  approval: Shield,
  case: AlertCircle,
  document: FileText,
  system: Info,
  action: AlertCircle,
  fyi: Info,
};

function getRelativeDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function getTimeGroup(timestamp: string): "today" | "this_week" | "earlier" {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "today";
  if (diffDays < 7) return "this_week";
  return "earlier";
}

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function getDaysColor(daysTaken: number, targetDays: number): string {
  if (daysTaken > targetDays) return "text-red-600 dark:text-red-400";
  if (daysTaken > targetDays * 0.75) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

export default function NotificationsPage() {
  const { items, markRead, markAllRead, dismiss } = useNotificationStore();
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"notifications" | "pending">("notifications");

  const handleFilterChange = (value: string | null) => {
    setFilter(value ?? "all");
  };

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.read);
    if (filter === "all") return items;
    return items.filter((n) => n.group === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const groups: Record<"today" | "this_week" | "earlier", typeof filteredItems> = {
      today: [],
      this_week: [],
      earlier: [],
    };
    for (const item of filteredItems) {
      const group = getTimeGroup(item.timestamp);
      groups[group].push(item);
    }
    return groups;
  }, [filteredItems]);

  const unreadCount = items.filter((n) => !n.read).length;

  const pendingWorks = useMemo(() => {
    const pending = MOCK_WORK_RECORDS.filter(
      (r) => r.userId === CURRENT_USER_ID && (r.status === "OPEN" || r.status === "SUBMITTED"),
    );
    const priorityOrder: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    pending.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 4;
      const pb = priorityOrder[b.priority] ?? 4;
      if (pa !== pb) return pa - pb;
      return b.daysTaken - a.daysTaken;
    });
    return pending;
  }, []);

  return (
    <PageFrame size="lg">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Notifications"
          subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCircle2 className="size-3 mr-1" />
              Mark all read
            </Button>
          }
        />

        {/* Tab navigation */}
        <div className="flex items-center gap-1 border-b">
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-xs font-semibold border-b-2 transition-colors",
              activeTab === "notifications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab("pending")}
          >
            My Pending Works
            {pendingWorks.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 px-1">
                {pendingWorks.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "notifications" && (
          <>
            {/* Filter bar */}
            <div className="flex items-center gap-3">
              <Filter className="size-3.5 text-muted-foreground" />
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                  <SelectItem value="unread" className="text-xs">
                    Unread only
                  </SelectItem>
                  <SelectItem value="action" className="text-xs">
                    Needs Action
                  </SelectItem>
                  <SelectItem value="fyi" className="text-xs">
                    FYI
                  </SelectItem>
                  <SelectItem value="system" className="text-xs">
                    System
                  </SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredItems.length} notifications
              </span>
            </div>

            {/* Notification groups */}
            <div className="flex flex-col gap-6">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <>
                  {grouped.today.length > 0 && (
                    <NotificationGroup
                      title="Today"
                      items={grouped.today}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                    />
                  )}
                  {grouped.this_week.length > 0 && (
                    <NotificationGroup
                      title="This Week"
                      items={grouped.this_week}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                    />
                  )}
                  {grouped.earlier.length > 0 && (
                    <NotificationGroup
                      title="Earlier"
                      items={grouped.earlier}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === "pending" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {pendingWorks.length} pending work record{pendingWorks.length !== 1 ? "s" : ""}
              </p>
            </div>

            {pendingWorks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No pending works</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Description
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Priority
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Days/Target
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWorks.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        style={{ height: "38px" }}
                      >
                        <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                          {record.date}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                            {record.workCategory}
                          </span>
                        </td>
                        <td
                          className="px-3 py-1.5 max-w-[280px] truncate"
                          title={record.description}
                        >
                          {record.description}
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                              priorityColors[record.priority],
                            )}
                          >
                            {record.priority}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <span className={getDaysColor(record.daysTaken, record.targetDays)}>
                            {record.daysTaken}/{record.targetDays}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                              statusColors[record.status],
                            )}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <Link
                            href="/ledger"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </PageFrame>
  );
}

function NotificationGroup({
  title,
  items,
  onMarkRead,
  onDismiss,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    context: string;
    timestamp: string;
    group: "action" | "fyi" | "system";
    read: boolean;
    actionLabel?: string;
    actionHref?: string;
  }>;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
        {title}
      </h3>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = typeIcons[item.group] || Bell;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                !item.read && "bg-accent/30 border-accent",
                item.read && "bg-card",
              )}
            >
              <div className="mt-0.5 shrink-0">
                <Icon
                  className={cn("size-4", !item.read ? "text-primary" : "text-muted-foreground")}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs",
                    !item.read ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.context}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeDate(item.timestamp)}
                  </span>
                  {item.actionLabel && item.actionHref && (
                    <Link
                      href={item.actionHref}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      {item.actionLabel}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!item.read && (
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px]"
                    onClick={() => onMarkRead(item.id)}
                    title="Mark as read"
                  >
                    <CheckCircle2 className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[10px]"
                  onClick={() => onDismiss(item.id)}
                  title="Dismiss"
                >
                  &times;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
