import { z } from "zod";
import { MOCK_APPROVALS, type MockApproval } from "@/lib/mock-data/approvals";
import {
  approvalListSchema,
  approveActionSchema,
  escalateActionSchema,
  rejectActionSchema,
} from "@/lib/validators/approvals";
import { protectedProcedure, router, supervisorProcedure } from "@/server/trpc";

// In-memory store for mutations
const approvals: MockApproval[] = [...MOCK_APPROVALS];

export const approvalsRouter = router({
  list: protectedProcedure.input(approvalListSchema).query(({ input }) => {
    let filtered = [...approvals];

    if (input.status) {
      filtered = filtered.filter((a) => a.status === input.status);
    }
    if (input.type) {
      filtered = filtered.filter((a) => a.type === input.type);
    }
    if (input.approverId) {
      filtered = filtered.filter((a) => a.approverId === input.approverId);
    }
    if (input.urgency) {
      filtered = filtered.filter((a) => a.urgency === input.urgency);
    }

    // Sort
    filtered.sort((a, b) => {
      const field = input.sortBy;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return input.sortOrder === "asc" ? cmp : -cmp;
    });

    const total = filtered.length;
    const items = filtered.slice(input.offset, input.offset + input.limit);

    return { items, total };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    const approval = approvals.find((a) => a.id === input.id);
    if (!approval) {
      throw new Error("Approval not found");
    }
    return approval;
  }),

  getPendingCount: protectedProcedure.query(() => {
    return approvals.filter((a) => a.status === "PENDING").length;
  }),

  approve: supervisorProcedure.input(approveActionSchema).mutation(({ input }) => {
    const idx = approvals.findIndex((a) => a.id === input.id);
    if (idx === -1) {
      throw new Error("Approval not found");
    }
    approvals[idx] = {
      ...approvals[idx],
      status: "APPROVED",
      decisionNotes: input.notes || null,
      decidedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return approvals[idx];
  }),

  reject: supervisorProcedure.input(rejectActionSchema).mutation(({ input }) => {
    const idx = approvals.findIndex((a) => a.id === input.id);
    if (idx === -1) {
      throw new Error("Approval not found");
    }
    approvals[idx] = {
      ...approvals[idx],
      status: "REJECTED",
      decisionNotes: input.reason,
      decidedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return approvals[idx];
  }),

  escalate: supervisorProcedure.input(escalateActionSchema).mutation(({ input }) => {
    const idx = approvals.findIndex((a) => a.id === input.id);
    if (idx === -1) {
      throw new Error("Approval not found");
    }
    approvals[idx] = {
      ...approvals[idx],
      status: "ESCALATED",
      decisionNotes: input.reason,
      updatedAt: new Date().toISOString(),
    };
    return approvals[idx];
  }),
});
