"use client";

import { trpc } from "@/lib/trpc/client";
import type { DocumentListInput } from "@/lib/validators/documents";

export function useDocumentList(input: DocumentListInput) {
  return trpc.documents.list.useQuery(input);
}

export function useDocumentDetail(id: string) {
  return trpc.documents.getById.useQuery({ id }, { enabled: !!id });
}

export function useDocumentUpload() {
  const utils = trpc.useUtils();
  return trpc.documents.upload.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
    },
  });
}

export function useDocumentUpdate() {
  const utils = trpc.useUtils();
  return trpc.documents.update.useMutation({
    // Optimistically patch the detail cache so status/field edits feel instant.
    onMutate: async (input) => {
      await utils.documents.getById.cancel({ id: input.id });
      const previous = utils.documents.getById.getData({ id: input.id });
      if (previous) {
        utils.documents.getById.setData(
          { id: input.id },
          {
            ...previous,
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.status !== undefined
              ? { status: input.status.toLowerCase() as typeof previous.status }
              : {}),
            ...(input.revision !== undefined ? { revision: input.revision } : {}),
          },
        );
      }
      return { previous };
    },
    onError: (_err, input, ctx) => {
      // Roll back on failure.
      if (ctx?.previous) {
        utils.documents.getById.setData({ id: input.id }, ctx.previous);
      }
    },
    onSettled: (_data, _err, input) => {
      utils.documents.list.invalidate();
      utils.documents.getById.invalidate({ id: input.id });
    },
  });
}

export function useDocumentDelete() {
  const utils = trpc.useUtils();
  return trpc.documents.delete.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.listDeleted.invalidate();
    },
  });
}

export function useDocumentRestore() {
  const utils = trpc.useUtils();
  return trpc.documents.restore.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.listDeleted.invalidate();
    },
  });
}

export function useDocumentLinkPl() {
  const utils = trpc.useUtils();
  return trpc.documents.linkPL.useMutation({
    // Optimistically add the PL id to the detail cache's linkedPlIds.
    onMutate: async (input) => {
      await utils.documents.getById.cancel({ id: input.documentId });
      const previous = utils.documents.getById.getData({ id: input.documentId });
      if (previous && !previous.linkedPlIds.includes(input.plId)) {
        utils.documents.getById.setData(
          { id: input.documentId },
          {
            ...previous,
            linkedPlIds: [...previous.linkedPlIds, input.plId],
          },
        );
      }
      return { previous };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.previous) {
        utils.documents.getById.setData({ id: input.documentId }, ctx.previous);
      }
    },
    onSettled: (_data, _err, input) => {
      utils.documents.getById.invalidate({ id: input.documentId });
    },
  });
}

export function useDocumentUnlinkPl() {
  const utils = trpc.useUtils();
  return trpc.documents.unlinkPL.useMutation({
    // Optimistically remove the PL id from the detail cache's linkedPlIds.
    onMutate: async (input) => {
      await utils.documents.getById.cancel({ id: input.documentId });
      const previous = utils.documents.getById.getData({ id: input.documentId });
      if (previous) {
        utils.documents.getById.setData(
          { id: input.documentId },
          {
            ...previous,
            linkedPlIds: previous.linkedPlIds.filter((id) => id !== input.plId),
          },
        );
      }
      return { previous };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.previous) {
        utils.documents.getById.setData({ id: input.documentId }, ctx.previous);
      }
    },
    onSettled: (_data, _err, input) => {
      utils.documents.getById.invalidate({ id: input.documentId });
    },
  });
}

export function useDocumentApprove() {
  const utils = trpc.useUtils();
  return trpc.documents.approve.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.getById.invalidate();
    },
  });
}

export function useDocumentBulkAction() {
  const utils = trpc.useUtils();
  return trpc.documents.bulkAction.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
    },
  });
}
