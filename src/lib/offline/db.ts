import Dexie, { type EntityTable } from "dexie";

// ─── Sync Queue Entry ──────────────────────────────────────────────────────────
export interface SyncQueueEntry {
  id?: number;
  mutationType: string;
  payload: string;
  clientMutationId: string;
  createdAt: string;
  retryCount: number;
  status: "pending" | "processing" | "completed" | "failed";
}

// ─── Cached Work Record ────────────────────────────────────────────────────────
export interface CachedWorkRecord {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  workspaceId: string;
  syncStatus: "synced" | "pending" | "conflict";
  updatedAt: string;
}

// ─── Offline Database ──────────────────────────────────────────────────────────
class OfflineDatabase extends Dexie {
  syncQueue!: EntityTable<SyncQueueEntry, "id">;
  cachedWorkRecords!: EntityTable<CachedWorkRecord, "id">;

  constructor() {
    super("LDOOfflineDB");

    this.version(1).stores({
      syncQueue: "++id, mutationType, payload, clientMutationId, createdAt, retryCount, status",
      cachedWorkRecords:
        "id, workOrderNumber, title, description, status, priority, workspaceId, syncStatus, updatedAt",
    });
  }
}

export const offlineDb = new OfflineDatabase();
