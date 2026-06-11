import { z } from "zod";
import {
  createPlSchema,
  plListSchema,
  plSearchSchema,
  updatePlSchema,
} from "@/lib/validators/pl-numbers";
import {
  createPl,
  getDocumentsByPlId,
  getPlById,
  getPlByNumber,
  listPlNumbers,
  searchPl,
  updatePl,
} from "@/server/services/mock-db";
import { engineerProcedure, protectedProcedure, router } from "@/server/trpc";

export const plRouter = router({
  list: protectedProcedure.input(plListSchema).query(({ input }) => {
    return listPlNumbers(input);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    const pl = getPlById(input.id);
    if (!pl) {
      throw new Error("PL number not found");
    }
    return pl;
  }),

  getByNumber: protectedProcedure
    .input(z.object({ plNumber: z.string().length(8) }))
    .query(({ input }) => {
      const pl = getPlByNumber(input.plNumber);
      if (!pl) {
        throw new Error("PL number not found");
      }
      return pl;
    }),

  create: engineerProcedure.input(createPlSchema).mutation(({ input, ctx }) => {
    // Check if PL number already exists
    const existing = getPlByNumber(input.plNumber);
    if (existing) {
      throw new Error("PL number already exists");
    }

    const newPl = createPl({
      plNumber: input.plNumber,
      name: input.name,
      description: input.description,
      category: input.category,
      status: input.status,
      safetyCritical: input.safetyCritical,
      drawingRef: input.drawingRef || null,
      specification: input.specification || null,
      unit: input.unit,
      workshop: input.workshop,
      createdBy: ctx.session.user?.id || "unknown",
      updatedBy: ctx.session.user?.id || "unknown",
    });

    return newPl;
  }),

  update: engineerProcedure.input(updatePlSchema).mutation(({ input, ctx }) => {
    const updated = updatePl(input.id, {
      ...input,
      updatedBy: ctx.session.user?.id || "unknown",
    });
    if (!updated) {
      throw new Error("PL number not found");
    }
    return updated;
  }),

  getLinkedDocs: protectedProcedure.input(z.object({ plId: z.string() })).query(({ input }) => {
    return getDocumentsByPlId(input.plId);
  }),

  search: protectedProcedure.input(plSearchSchema).query(({ input }) => {
    return searchPl(input.query, input.limit);
  }),
});
