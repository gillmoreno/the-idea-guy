import { APP_ID } from "./constants";
import { deriveRoom, type SyncScope } from "./crypto";
import { deleteIdbDatabase } from "./persistence";

/** IndexedDB database name — must match LocalFirstDoc / y-indexeddb. */
export function persistenceDbName(
  appId: string,
  scope: SyncScope,
  relayRoomId: string,
): string {
  return `${appId}:${scope}:${relayRoomId}`;
}

export async function roomPersistenceDbNames(
  roomCode: string,
  appId: string = APP_ID,
  includeAdmin = false,
  passphrase?: string,
): Promise<string[]> {
  const pp = passphrase?.trim() || undefined;
  const publicRoom = await deriveRoom(roomCode, appId, "public", pp);
  const names = [persistenceDbName(appId, "public", publicRoom)];
  if (includeAdmin) {
    const adminRoom = await deriveRoom(roomCode, appId, "admin", pp);
    names.push(persistenceDbName(appId, "admin", adminRoom));
  }
  return names;
}

function estimateValueSize(value: unknown): number {
  if (value == null) return 0;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  if (typeof value === "string") return value.length * 2;
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

function openDatabase(name: string): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(name);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

async function sumObjectStore(db: IDBDatabase, storeName: string): Promise<number> {
  if (!db.objectStoreNames.contains(storeName)) return 0;
  return new Promise((resolve, reject) => {
    let total = 0;
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      total += estimateValueSize(cursor.key);
      total += estimateValueSize(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve(total);
    tx.onerror = () => reject(tx.error);
  });
}

export async function measureIndexedDbDatabase(dbName: string): Promise<number> {
  const db = await openDatabase(dbName);
  if (!db) return 0;
  try {
    let total = 0;
    for (const storeName of Array.from(db.objectStoreNames)) {
      total += await sumObjectStore(db, storeName);
    }
    return total;
  } finally {
    db.close();
  }
}

export async function measureRoomLocalBytes(
  roomCode: string,
  includeAdmin = false,
  appId: string = APP_ID,
  passphrase?: string,
): Promise<number> {
  const names = await roomPersistenceDbNames(roomCode, appId, includeAdmin, passphrase);
  let total = 0;
  for (const name of names) {
    total += await measureIndexedDbDatabase(name);
  }
  return total;
}

/** Delete all local IndexedDB blobs for a room on this device. */
export async function deleteRoomLocalData(
  roomCode: string,
  includeAdmin = false,
  appId: string = APP_ID,
  passphrase?: string,
): Promise<void> {
  const names = await roomPersistenceDbNames(roomCode, appId, includeAdmin, passphrase);
  await Promise.all(names.map((name) => deleteIdbDatabase(name)));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
