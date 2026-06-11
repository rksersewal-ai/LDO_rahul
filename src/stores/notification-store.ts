"use client";

import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  context: string;
  timestamp: string;
  group: "action" | "fyi" | "system";
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Document requires approval",
    context: "Drawing DRG-2024-0847 submitted by R. Sharma",
    timestamp: "2 min ago",
    group: "action",
    read: false,
    actionLabel: "Review",
    actionHref: "/documents/DRG-2024-0847",
  },
  {
    id: "n2",
    title: "Revision uploaded",
    context: "Spec SPC-2024-0312 Rev.C uploaded by K. Patel",
    timestamp: "15 min ago",
    group: "fyi",
    read: false,
  },
  {
    id: "n3",
    title: "Transmittal dispatched",
    context: "TRN-2024-0089 sent to RDSO with 4 documents",
    timestamp: "1 hr ago",
    group: "fyi",
    read: false,
  },
  {
    id: "n4",
    title: "System backup completed",
    context: "Daily backup completed successfully at 02:00 IST",
    timestamp: "6 hr ago",
    group: "system",
    read: true,
  },
  {
    id: "n5",
    title: "Overdue review reminder",
    context: "DRG-2024-0801 review pending for 3 days",
    timestamp: "1 day ago",
    group: "action",
    read: false,
    actionLabel: "Open",
    actionHref: "/documents/DRG-2024-0801",
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  items: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.read).length,
  markRead: (id: string) =>
    set((state) => {
      const items = state.items.map((item) => (item.id === id ? { ...item, read: true } : item));
      return { items, unreadCount: items.filter((n) => !n.read).length };
    }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    })),
  dismiss: (id: string) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id);
      return { items, unreadCount: items.filter((n) => !n.read).length };
    }),
}));
