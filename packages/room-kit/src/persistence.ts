/** Object stores required by y-indexeddb — must match y-indexeddb/src/y-indexeddb.js */
const REQUIRED_STORES = ["updates", "custom"] as const;

function deleteDatabase(name: string): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

/** True when the DB exists and has every store y-indexeddb expects. */
export async function idbHasValidSchema(name: string): Promise<boolean> {
  if (typeof indexedDB === "undefined") return true;
  return new Promise((resolve) => {
    const req = indexedDB.open(name);
    req.onerror = () => resolve(false);
    req.onsuccess = () => {
      const db = req.result;
      const ok = REQUIRED_STORES.every((s) => db.objectStoreNames.contains(s));
      db.close();
      resolve(ok);
    };
  });
}

/** Drop a corrupt or legacy IndexedDB database (safe if missing). */
export async function deleteIdbDatabase(name: string): Promise<void> {
  await deleteDatabase(name);
}

/**
 * y-indexeddb throws NotFoundError when the DB exists but stores are missing
 * (common after dev crashes or schema drift). Wipe and let the next open recreate.
 */
export async function ensureIdbReady(name: string): Promise<void> {
  if (await idbHasValidSchema(name)) return;
  await deleteIdbDatabase(name);
}
