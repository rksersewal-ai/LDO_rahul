import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createWorkRecordSchema,
  getKPIsSchema,
  lockWorkRecordSchema,
  submitWorkRecordSchema,
  updateWorkRecordSchema,
  verifyWorkRecordSchema,
  workRecordListSchema,
} from "@/lib/validators/work-records";
import {
  createWorkRecord,
  getWorkRecordById,
  getWorkRecordKPIs,
  listWorkRecords,
  lockWorkRecord,
  submitWorkRecord,
  updateWorkRecord,
  verifyWorkRecord,
} from "@/server/services/mock-db";
import { engineerProcedure, protectedProcedure, router, supervisorProcedure } from "@/server/trpc";

export const workRouter = router({
  list: protectedProcedure.input(workRecordListSchema).query(({ input }) => {
    return listWorkRecords(input);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    const record = getWorkRecordById(input.id);
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }
    return record;
  }),

  create: engineerProcedure.input(createWorkRecordSchema).mutation(({ input, ctx }) => {
    const record = createWorkRecord({
      ...input,
      userId: ctx.session.user?.id || "unknown",
      userName: ctx.session.user?.name || "Unknown User",
    });
    return record;
  }),

  update: engineerProcedure.input(updateWorkRecordSchema).mutation(({ input }) => {
    const record = updateWorkRecord(input.id, input);
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }
    return record;
  }),

  submit: engineerProcedure.input(submitWorkRecordSchema).mutation(({ input }) => {
    const record = submitWorkRecord(input.id);
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }
    return record;
  }),

  verify: supervisorProcedure.input(verifyWorkRecordSchema).mutation(({ input, ctx }) => {
    const record = verifyWorkRecord(
      input.id,
      input.action,
      ctx.session.user?.id || "unknown",
      input.remarks,
    );
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }
    return record;
  }),

  lock: supervisorProcedure.input(lockWorkRecordSchema).mutation(({ input }) => {
    const record = lockWorkRecord(input.id);
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
    }
    return record;
  }),

  getKPIs: protectedProcedure.input(getKPIsSchema).query(({ input }) => {
    return getWorkRecordKPIs(input);
  }),

  assignWork: supervisorProcedure
    .input(
      z.object({
        workRecordId: z.string(),
        assignToUserId: z.string(),
        assignToUserName: z.string(),
      }),
    )
    .mutation(({ input, ctx }) => {
      const record = getWorkRecordById(input.workRecordId);
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work record not found" });
      }
      const updated = updateWorkRecord(input.workRecordId, {
        userId: input.assignToUserId,
        userName: input.assignToUserName,
        assignedAt: new Date().toISOString(),
        assignedBy: ctx.session.user?.id || "unknown",
        assignedByName: ctx.session.user?.name || "Unknown",
      });
      if (!updated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot assign work record - it may not be in OPEN status",
        });
      }
      return updated;
    }),

  getMyPendingWorks: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user?.id || "";
    const allRecords = listWorkRecords({
      userId,
      limit: 200,
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    });
    const pending = allRecords.data.filter((r) => r.status === "OPEN" || r.status === "SUBMITTED");
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
  }),
});
