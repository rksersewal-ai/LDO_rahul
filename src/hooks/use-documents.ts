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
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.getById.invalidate();
    },
  });
}

export function useDocumentDelete() {
  const utils = trpc.useUtils();
  return trpc.documents.delete.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
    },
  });
}

export function useDocumentLinkPl() {
  const utils = trpc.useUtils();
  return trpc.documents.linkPL.useMutation({
    onSuccess: () => {
      utils.documents.getById.invalidate();
    },
  });
}

export function useDocumentUnlinkPl() {
  const utils = trpc.useUtils();
  return trpc.documents.unlinkPL.useMutation({
    onSuccess: () => {
      utils.documents.getById.invalidate();
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
