"use client";

import { trpc } from "@/lib/trpc/client";
import type { PlListInput } from "@/lib/validators/pl-numbers";

export function usePlList(input: PlListInput) {
  return trpc.pl.list.useQuery(input);
}

export function usePlDetail(id: string) {
  return trpc.pl.getById.useQuery({ id }, { enabled: !!id });
}

export function usePlLinkedDocs(plId: string) {
  return trpc.pl.getLinkedDocs.useQuery({ plId }, { enabled: !!plId });
}

export function usePlSearch(query: string, limit = 10) {
  return trpc.pl.search.useQuery({ query, limit }, { enabled: query.length >= 2 });
}

export function usePlCreate() {
  const utils = trpc.useUtils();
  return trpc.pl.create.useMutation({
    onSuccess: () => {
      utils.pl.list.invalidate();
    },
  });
}

export function usePlUpdate() {
  const utils = trpc.useUtils();
  return trpc.pl.update.useMutation({
    onSuccess: () => {
      utils.pl.list.invalidate();
      utils.pl.getById.invalidate();
    },
  });
}
