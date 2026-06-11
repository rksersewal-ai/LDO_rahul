import { z } from "zod";
import {
  approveDocumentSchema,
  bulkActionSchema,
  documentListSchema,
  linkPlSchema,
  unlinkPlSchema,
  updateDocumentSchema,
  uploadDocumentSchema,
} from "@/lib/validators/documents";
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  linkDocumentToPl,
  listDocuments,
  unlinkDocumentFromPl,
  updateDocument,
} from "@/server/services/mock-db";
import { engineerProcedure, protectedProcedure, router, supervisorProcedure } from "@/server/trpc";

export const documentsRouter = router({
  list: protectedProcedure.input(documentListSchema).query(({ input }) => {
    return listDocuments(input);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    const doc = getDocumentById(input.id);
    if (!doc) {
      throw new Error("Document not found");
    }
    return doc;
  }),

  upload: engineerProcedure.input(uploadDocumentSchema).mutation(({ input, ctx }) => {
    const newDoc = createDocument({
      documentNumber: input.documentNumber,
      title: input.title,
      category: input.category,
      status: "DRAFT",
      revision: input.revision,
      revisionDate: input.revisionDate || null,
      agency: input.agency || "CLW",
      fileType: "pdf",
      fileSize: 0,
      fileHash: null,
      filePath: null,
      pages: 1,
      ownerId: ctx.session.user?.id || "unknown",
      uploadedBy: ctx.session.user?.id || "unknown",
      ocrStatus: "PENDING",
      ocrConfidence: null,
      ocrText: null,
      tags: input.tags,
      isLatest: true,
      isDuplicate: false,
      linkedPlIds: input.linkedPlIds,
    });
    return newDoc;
  }),

  update: engineerProcedure.input(updateDocumentSchema).mutation(({ input }) => {
    const updated = updateDocument(input.id, input);
    if (!updated) {
      throw new Error("Document not found");
    }
    return updated;
  }),

  delete: engineerProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const success = deleteDocument(input.id);
    if (!success) {
      throw new Error("Document not found");
    }
    return { success: true };
  }),

  linkPL: engineerProcedure.input(linkPlSchema).mutation(({ input }) => {
    const success = linkDocumentToPl(input.documentId, input.plId);
    if (!success) {
      throw new Error("Document not found");
    }
    return { success: true };
  }),

  unlinkPL: engineerProcedure.input(unlinkPlSchema).mutation(({ input }) => {
    const success = unlinkDocumentFromPl(input.documentId, input.plId);
    if (!success) {
      throw new Error("Document not found");
    }
    return { success: true };
  }),

  approve: supervisorProcedure.input(approveDocumentSchema).mutation(({ input }) => {
    const updated = updateDocument(input.id, { status: "APPROVED" });
    if (!updated) {
      throw new Error("Document not found");
    }
    return updated;
  }),

  bulkAction: engineerProcedure.input(bulkActionSchema).mutation(({ input }) => {
    const results = input.ids.map((id) => {
      switch (input.action) {
        case "delete":
          return { id, success: deleteDocument(id) };
        case "changeStatus":
          if (input.value) {
            const updated = updateDocument(id, { status: input.value as MockDocument["status"] });
            return { id, success: !!updated };
          }
          return { id, success: false };
        case "addTag":
          if (input.value) {
            const doc = getDocumentById(id);
            if (doc && !doc.tags.includes(input.value)) {
              updateDocument(id, { tags: [...doc.tags, input.value] });
              return { id, success: true };
            }
          }
          return { id, success: false };
        default:
          return { id, success: false };
      }
    });
    return results;
  }),
});

// Import type for bulk action
import type { MockDocument } from "@/lib/mock-data/documents";
