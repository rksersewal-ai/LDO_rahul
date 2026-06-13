"use client";

import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { type Notification, useNotificationStore } from "@/stores/notification-store";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

function NotificationItem({
  item,
  onMarkRead,
  onDismiss,
  onAction,
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction: (id: string, href: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md px-3 py-2 text-xs",
        !item.read && "bg-accent/50",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.title}</p>
        <p className="text-muted-foreground mt-0.5 truncate">{item.context}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-muted-foreground text-[10px]">{item.timestamp}</span>
          {item.actionLabel && item.actionHref && (
            <button
              type="button"
              className="text-primary font-medium hover:underline text-[10px]"
              onClick={() => onAction(item.id, item.actionHref!)}
            >
              {item.actionLabel}
            </button>
          )}
          {item.actionLabel && !item.actionHref && (
            <button
              type="button"
              className="text-primary font-medium hover:underline text-[10px]"
              onClick={() => onMarkRead(item.id)}
            >
              {item.actionLabel}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {!item.read && (
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => onMarkRead(item.id)}
            title="Mark as read"
          >
            <Check className="size-3" />
          </button>
        )}
        <button
          type="button"
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={() => onDismiss(item.id)}
          title="Dismiss"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { items, markRead, markAllRead, dismiss } = useNotificationStore();

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead(id);
    },
    [markRead],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      dismiss(id);
    },
    [dismiss],
  );

  const handleAction = useCallback(
    (id: string, href: string) => {
      markRead(id);
      onClose();
      router.push(href);
    },
    [markRead, onClose, router],
  );

  if (!open) return null;

  const actionItems = items.filter((n) => n.group === "action");
  const fyiItems = items.filter((n) => n.group === "fyi");
  const systemItems = items.filter((n) => n.group === "system");

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-1 z-50 w-[360px] rounded-lg border bg-popover shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <button
            type="button"
            className="text-xs text-primary hover:underline font-medium"
            onClick={markAllRead}
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-2 px-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <>
              {actionItems.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Needs Action
                  </p>
                  {actionItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onMarkRead={handleMarkRead}
                      onDismiss={handleDismiss}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
              {fyiItems.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    FYI
                  </p>
                  {fyiItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onMarkRead={handleMarkRead}
                      onDismiss={handleDismiss}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
              {systemItems.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    System
                  </p>
                  {systemItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onMarkRead={handleMarkRead}
                      onDismiss={handleDismiss}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
