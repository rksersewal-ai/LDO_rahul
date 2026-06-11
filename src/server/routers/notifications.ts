import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";

export interface NotificationItem {
  id: string;
  type: "approval" | "case" | "document" | "system";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
  group: "action" | "fyi" | "system";
}

// Generate mock notifications from various events
const mockNotifications: NotificationItem[] = [
  {
    id: "notif-001",
    type: "approval",
    title: "New approval request",
    body: "TM-4907 GA Drawing Rev.3 requires your approval",
    timestamp: "2026-01-22T09:00:00Z",
    read: false,
    actionLabel: "Review",
    actionHref: "/approvals",
    group: "action",
  },
  {
    id: "notif-002",
    type: "approval",
    title: "Critical approval pending",
    body: "Bogie Frame Stress Analysis Report - due in 2 days",
    timestamp: "2026-01-22T08:30:00Z",
    read: false,
    actionLabel: "Approve",
    actionHref: "/approvals",
    group: "action",
  },
  {
    id: "notif-003",
    type: "case",
    title: "Case escalated to you",
    body: "CASE-2026-006: Bogie Frame Crack Detection escalated for review",
    timestamp: "2026-01-21T10:00:00Z",
    read: false,
    actionLabel: "View Case",
    actionHref: "/cases",
    group: "action",
  },
  {
    id: "notif-004",
    type: "case",
    title: "Case assigned",
    body: "CASE-2026-010: Insulation Resistance Drop assigned to you",
    timestamp: "2026-01-21T08:30:00Z",
    read: false,
    actionLabel: "Open",
    actionHref: "/cases",
    group: "action",
  },
  {
    id: "notif-005",
    type: "document",
    title: "Document revision uploaded",
    body: "Spec SPC-2024-0312 Rev.C uploaded by K. Patel",
    timestamp: "2026-01-22T07:15:00Z",
    read: false,
    actionLabel: "View",
    actionHref: "/documents",
    group: "fyi",
  },
  {
    id: "notif-006",
    type: "document",
    title: "Document approved",
    body: "Brake System Test Report has been approved by Shri A.K. Verma",
    timestamp: "2026-01-21T11:30:00Z",
    read: true,
    group: "fyi",
  },
  {
    id: "notif-007",
    type: "approval",
    title: "Your request was rejected",
    body: "Wiring diagram DRG-2024-0847 needs revision per reviewer comments",
    timestamp: "2026-01-20T16:45:00Z",
    read: false,
    actionLabel: "View Details",
    actionHref: "/approvals",
    group: "action",
  },
  {
    id: "notif-008",
    type: "case",
    title: "Case resolved",
    body: "CASE-2026-003: BOM Discrepancy has been resolved",
    timestamp: "2026-01-20T16:00:00Z",
    read: true,
    group: "fyi",
  },
  {
    id: "notif-009",
    type: "document",
    title: "Transmittal dispatched",
    body: "TRN-2024-0089 sent to RDSO with 4 documents",
    timestamp: "2026-01-20T14:00:00Z",
    read: true,
    group: "fyi",
  },
  {
    id: "notif-010",
    type: "system",
    title: "System backup completed",
    body: "Daily backup completed successfully at 02:00 IST",
    timestamp: "2026-01-22T02:00:00Z",
    read: true,
    group: "system",
  },
  {
    id: "notif-011",
    type: "system",
    title: "Scheduled maintenance",
    body: "System maintenance window: Jan 25, 02:00-04:00 IST",
    timestamp: "2026-01-21T09:00:00Z",
    read: true,
    group: "system",
  },
  {
    id: "notif-012",
    type: "case",
    title: "Case comment added",
    body: "Shri A.K. Verma commented on CASE-2026-001: Bearing Failure",
    timestamp: "2026-01-20T14:00:00Z",
    read: true,
    group: "fyi",
  },
  {
    id: "notif-013",
    type: "approval",
    title: "Approval reminder",
    body: "BOM Change: Replace Bearing Supplier - due tomorrow",
    timestamp: "2026-01-22T06:00:00Z",
    read: false,
    actionLabel: "Review",
    actionHref: "/approvals",
    group: "action",
  },
  {
    id: "notif-014",
    type: "document",
    title: "Overdue review reminder",
    body: "DRG-2024-0801 review pending for 3 days",
    timestamp: "2026-01-19T08:00:00Z",
    read: false,
    actionLabel: "Open",
    actionHref: "/documents",
    group: "action",
  },
  {
    id: "notif-015",
    type: "system",
    title: "Storage usage alert",
    body: "Document storage at 78% capacity. Consider archiving old revisions.",
    timestamp: "2026-01-19T06:00:00Z",
    read: true,
    group: "system",
  },
];

// In-memory store
const notifications: NotificationItem[] = [...mockNotifications];

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
        type: z.enum(["approval", "case", "document", "system"]).optional(),
      }),
    )
    .query(({ input }) => {
      let filtered = [...notifications];

      if (input.unreadOnly) {
        filtered = filtered.filter((n) => !n.read);
      }
      if (input.type) {
        filtered = filtered.filter((n) => n.type === input.type);
      }

      // Sort by timestamp descending
      filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      const total = filtered.length;
      const items = filtered.slice(input.offset, input.offset + input.limit);

      return { items, total };
    }),

  getUnreadCount: protectedProcedure.query(() => {
    return notifications.filter((n) => !n.read).length;
  }),

  markRead: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const idx = notifications.findIndex((n) => n.id === input.id);
    if (idx !== -1) {
      notifications[idx] = { ...notifications[idx], read: true };
    }
    return { success: true };
  }),

  markAllRead: protectedProcedure.mutation(() => {
    for (let i = 0; i < notifications.length; i++) {
      notifications[i] = { ...notifications[i], read: true };
    }
    return { success: true };
  }),

  dismiss: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const idx = notifications.findIndex((n) => n.id === input.id);
    if (idx !== -1) {
      notifications.splice(idx, 1);
    }
    return { success: true };
  }),
});
