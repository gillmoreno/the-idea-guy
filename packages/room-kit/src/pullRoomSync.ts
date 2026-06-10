import { IndexeddbPersistence } from "y-indexeddb";
import { deriveChannelKey, deriveRoom, decrypt, encrypt, publicKeyMaterial } from "./crypto";
import { hashDocState } from "./docStateHash";
import { ensureIdbReady } from "./persistence";
import { frameCheckpoint, MSG_SYNC_END, unwrapFrame } from "./relayProtocol";
import { persistenceDbName } from "./storageSize";
import { Y } from "./yjs";

const REMOTE_ORIGIN = "remote";
const PULL_TIMEOUT_MS = 30_000;
const SYNC_END_FALLBACK_MS = 1500;

export interface PullRoomPublicOptions {
  appId: string;
  roomCode: string;
  relayUrl: string;
  passphrase?: string;
}

export interface PullRoomPublicResult {
  stateHash: string;
  /** Relay backlog changed the local doc (before vs after merge). */
  relayChangedDoc: boolean;
  connected: boolean;
  error?: string;
}

/**
 * One-shot pull: load local IndexedDB → replay relay backlog → checkpoint → close.
 * Does not keep a WebSocket open or auto-reconnect.
 */
export async function pullRoomPublicChannel(
  opts: PullRoomPublicOptions,
): Promise<PullRoomPublicResult> {
  const keyMaterial = publicKeyMaterial(opts.roomCode);
  const passphrase = opts.passphrase?.trim() || undefined;
  const key = await deriveChannelKey(opts.roomCode, keyMaterial, passphrase);
  const relayRoom = await deriveRoom(opts.roomCode, opts.appId, "public", passphrase);
  const dbName = persistenceDbName(opts.appId, "public", relayRoom);

  await ensureIdbReady(dbName);

  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(dbName, doc);

  try {
    type IdbPersistence = IndexeddbPersistence & { _db: Promise<IDBDatabase> };
    await (persistence as IdbPersistence)._db;
    await persistence.whenSynced;
  } catch {
    await persistence.destroy().catch(() => {});
    doc.destroy();
    return {
      stateHash: "",
      relayChangedDoc: false,
      connected: false,
      error: "local_storage_unavailable",
    };
  }

  const hashBefore = await hashDocState(doc);

  try {
    await replayRelayBacklog({
      relayUrl: opts.relayUrl,
      relayRoom,
      key,
      doc,
    });
  } catch (err) {
    await persistence.destroy().catch(() => {});
    doc.destroy();
    return {
      stateHash: hashBefore,
      relayChangedDoc: false,
      connected: false,
      error: err instanceof Error ? err.message : "relay_sync_failed",
    };
  }

  const stateHash = await hashDocState(doc);
  const relayChangedDoc = stateHash !== hashBefore;

  await persistence.destroy().catch(() => {});
  doc.destroy();

  return {
    stateHash,
    relayChangedDoc,
    connected: true,
  };
}

async function replayRelayBacklog(params: {
  relayUrl: string;
  relayRoom: string;
  key: CryptoKey;
  doc: Y.Doc;
}): Promise<void> {
  const url = `${params.relayUrl.replace(/\/$/, "")}/sync?room=${encodeURIComponent(params.relayRoom)}`;

  return new Promise((resolve, reject) => {
    let settled = false;
    let ws: WebSocket;
    let syncEndFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let checkpointSent = false;

    const sendCheckpointAndFinish = async () => {
      if (checkpointSent || settled) return;
      checkpointSent = true;
      if (syncEndFallbackTimer) {
        clearTimeout(syncEndFallbackTimer);
        syncEndFallbackTimer = null;
      }
      try {
        const update = Y.encodeStateAsUpdate(params.doc);
        const blob = await encrypt(params.key, update);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(frameCheckpoint(blob));
        }
      } catch (err) {
        finish(err instanceof Error ? err : new Error("checkpoint_failed"));
        return;
      }
      finish();
    };

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (syncEndFallbackTimer) {
        clearTimeout(syncEndFallbackTimer);
        syncEndFallbackTimer = null;
      }
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(() => {
      finish(new Error("pull_timeout"));
    }, PULL_TIMEOUT_MS);

    try {
      ws = new WebSocket(url);
    } catch (err) {
      finish(err instanceof Error ? err : new Error("websocket_open_failed"));
      return;
    }

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      syncEndFallbackTimer = setTimeout(() => {
        void sendCheckpointAndFinish();
      }, SYNC_END_FALLBACK_MS);
    };

    ws.onerror = () => finish(new Error("websocket_error"));

    ws.onmessage = (ev) => {
      void (async () => {
        try {
          const data = ev.data;
          const bytes =
            data instanceof ArrayBuffer
              ? new Uint8Array(data)
              : new Uint8Array(await (data as Blob).arrayBuffer());

          const { type, payload, legacy } = unwrapFrame(bytes);
          if (type === MSG_SYNC_END) {
            await sendCheckpointAndFinish();
            return;
          }

          const encrypted = legacy ? bytes : payload;
          const plain = await decrypt(params.key, encrypted);
          if (!plain) return;
          Y.applyUpdate(params.doc, plain, REMOTE_ORIGIN);
        } catch (err) {
          finish(err instanceof Error ? err : new Error("message_handler_failed"));
        }
      })();
    };
  });
}
