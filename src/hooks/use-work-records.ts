"use client";

import { trpc } from "@/lib/trpc/client";
import type { GetKPIsInput, WorkRecordListInput } from "@/lib/validators/work-records";

export function useWorkRecordList(input: WorkRecordListInput) {
  return trpc.work.list.useQuery(input);
}

export function useWorkRecordDetail(id: string) {
  return trpc.work.getById.useQuery({ id }, { enabled: !!id });
}

export function useWorkRecordCreate() {
  const utils = trpc.useUtils();
  return trpc.work.create.useMutation({
    onSuccess: () => {
      utils.work.list.invalidate();
      utils.work.getKPIs.invalidate();
    },
  });
}

export function useWorkRecordUpdate() {
  const utils = trpc.useUtils();
  return trpc.work.update.useMutation({
    onSuccess: () => {
      utils.work.list.invalidate();
      utils.work.getById.invalidate();
    },
  });
}

export function useWorkRecordSubmit() {
  const utils = trpc.useUtils();
  return trpc.work.submit.useMutation({
    onSuccess: () => {
      utils.work.list.invalidate();
      utils.work.getById.invalidate();
      utils.work.getKPIs.invalidate();
    },
  });
}

export function useWorkRecordVerify() {
  const utils = trpc.useUtils();
  return trpc.work.verify.useMutation({
    onSuccess: () => {
      utils.work.list.invalidate();
      utils.work.getById.invalidate();
      utils.work.getKPIs.invalidate();
    },
  });
}

export function useWorkRecordLock() {
  const utils = trpc.useUtils();
  return trpc.work.lock.useMutation({
    onSuccess: () => {
      utils.work.list.invalidate();
      utils.work.getById.invalidate();
    },
  });
}

export function useWorkRecordKPIs(input: GetKPIsInput) {
  return trpc.work.getKPIs.useQuery(input);
}
