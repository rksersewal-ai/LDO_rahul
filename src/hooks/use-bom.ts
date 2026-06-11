"use client";

import { trpc } from "@/lib/trpc/client";

export function useBomProducts() {
  return trpc.bom.products.useQuery();
}

export function useBomProduct(productId: string) {
  return trpc.bom.getProduct.useQuery({ productId }, { enabled: !!productId });
}

export function useBomCreateProduct() {
  const utils = trpc.useUtils();
  return trpc.bom.createProduct.useMutation({
    onSuccess: () => {
      utils.bom.products.invalidate();
    },
  });
}

export function useBomAddEntry() {
  const utils = trpc.useUtils();
  return trpc.bom.addEntry.useMutation({
    onSuccess: (_data, variables) => {
      utils.bom.getProduct.invalidate({ productId: variables.productId });
    },
  });
}

export function useBomMoveEntry(productId: string) {
  const utils = trpc.useUtils();
  return trpc.bom.moveEntry.useMutation({
    onSuccess: () => {
      utils.bom.getProduct.invalidate({ productId });
    },
  });
}

export function useBomUpdateEntry(productId: string) {
  const utils = trpc.useUtils();
  return trpc.bom.updateEntry.useMutation({
    onSuccess: () => {
      utils.bom.getProduct.invalidate({ productId });
    },
  });
}

export function useBomRemoveEntry(productId: string) {
  const utils = trpc.useUtils();
  return trpc.bom.removeEntry.useMutation({
    onSuccess: () => {
      utils.bom.getProduct.invalidate({ productId });
    },
  });
}

export function useBomLinkPL(productId: string) {
  const utils = trpc.useUtils();
  return trpc.bom.linkPL.useMutation({
    onSuccess: () => {
      utils.bom.getProduct.invalidate({ productId });
    },
  });
}
