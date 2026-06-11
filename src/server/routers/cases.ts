import { z } from "zod";
import { MOCK_CASES, type MockCase } from "@/lib/mock-data/cases";
import { MOCK_USERS } from "@/lib/mock-data/users";
import {
  assignCaseSchema,
  caseListSchema,
  closeCaseSchema,
  createCaseSchema,
  updateCaseSchema,
} from "@/lib/validators/cases";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

// In-memory store for mutations
const cases: MockCase[] = [...MOCK_CASES];
let caseCounter = MOCK_CASES.length;

export const casesRouter = router({
  list: protectedProcedure.input(caseListSchema).query(({ input }) => {
    let filtered = [...cases];

    if (input.status) {
      filtered = filtered.filter((c) => c.status === input.status);
    }
    if (input.severity) {
      filtered = filtered.filter((c) => c.severity === input.severity);
    }
    if (input.type) {
      filtered = filtered.filter((c) => c.type === input.type);
    }
    if (input.assigneeId) {
      filtered = filtered.filter((c) => c.assigneeId === input.assigneeId);
    }
    if (input.search) {
      const search = input.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.caseNumber.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search),
      );
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
    const caseItem = cases.find((c) => c.id === input.id);
    if (!caseItem) {
      throw new Error("Case not found");
    }
    return caseItem;
  }),

  create: engineerProcedure.input(createCaseSchema).mutation(({ input, ctx }) => {
    caseCounter++;
    const caseNumber = `CASE-2026-${String(caseCounter).padStart(3, "0")}`;
    const assignee = MOCK_USERS.find((u) => u.id === input.assigneeId);

    const newCase: MockCase = {
      id: `case-${String(caseCounter).padStart(3, "0")}`,
      caseNumber,
      title: input.title,
      description: input.description,
      type: input.type,
      status: "OPEN",
      severity: input.severity,
      assigneeId: input.assigneeId,
      assigneeName: assignee?.name || "Unknown",
      reporterId: ctx.session.user?.id || "unknown",
      reporterName: ctx.session.user?.name || "Unknown",
      plNumber: input.plNumber || null,
      vendorName: input.vendorName || null,
      tenderNumber: input.tenderNumber || null,
      linkedDocumentIds: [],
      resolution: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: null,
    };

    cases.unshift(newCase);
    return newCase;
  }),

  update: engineerProcedure.input(updateCaseSchema).mutation(({ input }) => {
    const idx = cases.findIndex((c) => c.id === input.id);
    if (idx === -1) {
      throw new Error("Case not found");
    }

    const { id, ...updates } = input;
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value === "" ? null : value;
      }
    }

    cases[idx] = {
      ...cases[idx],
      ...cleanUpdates,
      updatedAt: new Date().toISOString(),
    } as MockCase;

    return cases[idx];
  }),

  close: engineerProcedure.input(closeCaseSchema).mutation(({ input }) => {
    const idx = cases.findIndex((c) => c.id === input.id);
    if (idx === -1) {
      throw new Error("Case not found");
    }
    cases[idx] = {
      ...cases[idx],
      status: "CLOSED",
      resolution: input.resolution,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return cases[idx];
  }),

  assign: engineerProcedure.input(assignCaseSchema).mutation(({ input }) => {
    const idx = cases.findIndex((c) => c.id === input.id);
    if (idx === -1) {
      throw new Error("Case not found");
    }
    const assignee = MOCK_USERS.find((u) => u.id === input.assigneeId);
    cases[idx] = {
      ...cases[idx],
      assigneeId: input.assigneeId,
      assigneeName: assignee?.name || "Unknown",
      updatedAt: new Date().toISOString(),
    };
    return cases[idx];
  }),
});
