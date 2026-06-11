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
});
