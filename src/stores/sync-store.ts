"use client";

import { create } from "zustand";

export interface SyncMutation {
  mutationType: string;
  payload: string;
  clientMutationId: string;
}

interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
}

interface SyncActions {
  addToQueue: (mutation: SyncMutation) => void;
  processQueue: () => void;
  clearResolved: () => void;
  setOnline: (status: boolean) => void;
}

type SyncStore = SyncState & SyncActions;

export const useSyncStore = create<SyncStore>((set, get) => ({
  // State
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,

  // Actions
  addToQueue: (_mutation: SyncMutation) => {
    // In a real runtime, this would dynamically import Dexie and insert:
    // const { offlineDb } = await import("@/lib/offline/db");
    // await offlineDb.syncQueue.add({ ...mutation, createdAt: new Date().toISOString(), retryCount: 0, status: "pending" });
    set((state) => ({ pendingCount: state.pendingCount + 1 }));
  },

  processQueue: () => {
    const { pendingCount } = get();
    if (pendingCount === 0) return;

    set({ isSyncing: true });

    // Placeholder: in production this would iterate Dexie syncQueue entries
    // and call tRPC mutations with their clientMutationId.
    // On completion of each item, decrement pendingCount.
    setTimeout(() => {
      set((state) => ({
        isSyncing: false,
        pendingCount: Math.max(0, state.pendingCount - 1),
        lastSyncAt: new Date(),
      }));
    }, 0);
  },

  clearResolved: () => {
    // In production: await offlineDb.syncQueue.where("status").equals("completed").delete();
    set({ pendingCount: 0 });
  },

  setOnline: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      // When coming back online, trigger queue processing
      get().processQueue();
    }
  },
}));

// Browser-only: listen for online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useSyncStore.getState().setOnline(true);
  });
  window.addEventListener("offline", () => {
    useSyncStore.getState().setOnline(false);
  });
}
