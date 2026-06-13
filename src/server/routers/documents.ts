import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createAuditEntry } from "@/lib/audit/create-entry";
import { db } from "@/lib/db";
import { documentCabinets, documentCategoryEnum, documents, documentTags } from "@/lib/db/schema";
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

function requireWorkspaceId(ctx: { session: { user: { workspaceId: string | null } } }): string {
  const wsId = ctx.session.user.workspaceId;
  if (!wsId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No workspace assigned. Contact an administrator.",
    });
  }
  return wsId;
}

// TODO(DB): Replace mock-db document operations with real Drizzle queries or guard them behind MOCK_MODE.
export const documentsRouter = router({
  list: protectedProcedure.input(documentListSchema).query(({ input }) => {
    return listDocuments(input);
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    const doc = getDocumentById(input.id);
    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }
    return doc;
  }),

  upload: engineerProcedure.input(uploadDocumentSchema).mutation(({ input, ctx }) => {
    const newDoc = createDocument({
      documentNumber: input.documentNumber,
      title: input.title,
      category: input.category,
      status: "draft",
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
      ocrStatus: "queued",
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
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }
    return updated;
  }),

  delete: engineerProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
    const success = deleteDocument(input.id);
    if (!success) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }
    return { success: true };
  }),

  linkPL: engineerProcedure.input(linkPlSchema).mutation(({ input }) => {
    const success = linkDocumentToPl(input.documentId, input.plId);
    if (!success) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }
    return { success: true };
  }),

  unlinkPL: engineerProcedure.input(unlinkPlSchema).mutation(({ input }) => {
    const success = unlinkDocumentFromPl(input.documentId, input.plId);
    if (!success) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }
    return { success: true };
  }),

  approve: supervisorProcedure.input(approveDocumentSchema).mutation(({ input }) => {
    const updated = updateDocument(input.id, { status: "approved" });
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
    }
    return updated;
  }),

  bulkAction: engineerProcedure.input(bulkActionSchema).mutation(async ({ input, ctx }) => {
    const workspaceId = requireWorkspaceId(ctx);
    const userId = ctx.session.user.id;
    const userName = ctx.session.user.name ?? "Unknown";

    const succeeded: string[] = [];
    const failed: string[] = [];
    const errors: Array<{ id: string; reason: string }> = [];

    // Validate all documents belong to this workspace
    const docs = await db
      .select({ id: documents.id, status: documents.status })
      .from(documents)
      .where(and(inArray(documents.id, input.ids), eq(documents.workspaceId, workspaceId)));

    const validDocIds = new Set(docs.map((d) => d.id));
    const docStatusMap = new Map(docs.map((d) => [d.id, d.status]));

    // Check for IDs not in workspace
    for (const id of input.ids) {
      if (!validDocIds.has(id)) {
        failed.push(id);
        errors.push({ id, reason: "Document not found in workspace" });
      }
    }

    // Filter to only valid docs
    const validIds = input.ids.filter((id) => validDocIds.has(id));

    // For delete action, skip legal-held (approved) documents
    const processableIds: string[] = [];
    if (input.action === "delete") {
      for (const id of validIds) {
        const status = docStatusMap.get(id);
        if (status === "approved") {
          failed.push(id);
          errors.push({ id, reason: "Cannot delete approved/legal-held document" });
        } else {
          processableIds.push(id);
        }
      }
    } else {
      processableIds.push(...validIds);
    }

    if (processableIds.length === 0) {
      return { succeeded, failed, errors };
    }

    // Process the bulk action
    switch (input.action) {
      case "archive": {
        await db
          .update(documents)
          .set({ status: "archived", updatedAt: new Date(), updatedBy: userId })
          .where(
            and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "delete": {
        await db
          .update(documents)
          .set({ isDeleted: 1, deletedAt: new Date(), updatedAt: new Date(), updatedBy: userId })
          .where(
            and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "tag": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Tag ID (value) is required for tag action" });
          }
          break;
        }
        for (const docId of processableIds) {
          try {
            await db
              .insert(documentTags)
              .values({
                documentId: docId,
                tagId: input.value,
                taggedBy: userId,
              })
              .onConflictDoNothing();
            succeeded.push(docId);
          } catch {
            failed.push(docId);
            errors.push({ id: docId, reason: "Failed to add tag" });
          }
        }
        break;
      }

      case "untag": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Tag ID (value) is required for untag action" });
          }
          break;
        }
        await db
          .delete(documentTags)
          .where(
            and(inArray(documentTags.documentId, processableIds), eq(documentTags.tagId, input.value)),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "cabinet_add": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Cabinet ID (value) is required for cabinet_add action" });
          }
          break;
        }
        for (const docId of processableIds) {
          try {
            await db
              .insert(documentCabinets)
              .values({
                documentId: docId,
                cabinetId: input.value,
                addedBy: userId,
              })
              .onConflictDoNothing();
            succeeded.push(docId);
          } catch {
            failed.push(docId);
            errors.push({ id: docId, reason: "Failed to add to cabinet" });
          }
        }
        break;
      }

      case "cabinet_remove": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({
              id,
              reason: "Cabinet ID (value) is required for cabinet_remove action",
            });
          }
          break;
        }
        await db
          .delete(documentCabinets)
          .where(
            and(
              inArray(documentCabinets.documentId, processableIds),
              eq(documentCabinets.cabinetId, input.value),
            ),
          );
        succeeded.push(...processableIds);
        break;
      }

      case "classify": {
        if (!input.value) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: "Category (value) is required for classify action" });
          }
          break;
        }
        // Validate category against allowed enum values
        const validCategories = documentCategoryEnum.enumValues;
        if (!validCategories.includes(input.value as typeof validCategories[number])) {
          for (const id of processableIds) {
            failed.push(id);
            errors.push({ id, reason: `Invalid category "${input.value}". Must be one of: ${validCategories.join(", ")}` });
          }
          break;
        }
        await db
          .update(documents)
          .set({
            category: input.value as typeof documents.category.enumValues[number],
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(
            and(inArray(documents.id, processableIds), eq(documents.workspaceId, workspaceId)),
          );
        succeeded.push(...processableIds);
        break;
      }
    }

    // Create audit entry for the bulk operation
    await createAuditEntry(db, {
      userId,
      userName,
      action: `bulk_${input.action}`,
      resourceType: "document",
      resourceId: processableIds[0] ?? input.ids[0],
      resourceTitle: `Bulk ${input.action} on ${input.ids.length} documents`,
      details: `Action: ${input.action}, Total: ${input.ids.length}, Succeeded: ${succeeded.length}, Failed: ${failed.length}`,
      workspaceId,
    });

    return { succeeded, failed, errors };
  }),
});
