// LocalFirstDoc — Yjs + IndexedDB + E2E-encrypted sync over the relay.
import { Y } from "./yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { deriveChannelKey, deriveRoom, encrypt, decrypt, type SyncScope } from "./crypto";
import { deleteIdbDatabase, ensureIdbReady } from "./persistence";
import {
  frameCheckpoint,
  frameUpdate,
  MSG_SYNC_END,
  unwrapFrame,
} from "./relayProtocol";
import { encodeCompactedState } from "./compactDoc";

const REMOTE_ORIGIN = "remote";
const SYNC_END_FALLBACK_MS = 1500;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

export interface CompactResult {
  before: number;
  after: number;
}

export interface SyncState {
  localLoaded: boolean;
  connected: boolean;
}

export interface LocalFirstOptions {
  appId: string;
  /** Full string used to derive AES key (use publicKeyMaterial / adminKeyMaterial). */
  keyMaterial: string;
  roomCode: string;
  scope: SyncScope;
  relayUrl: string;
  /** Optional room passphrase — enables Argon2id key + relay id derivation. */
  passphrase?: string;
  onChange?: () => void;
  onState?: (state: SyncState) => void;
}

export class LocalFirstDoc {
  private _doc: Y.Doc;
  get doc(): Y.Doc {
    return this._doc;
  }
  private readonly appId: string;
  private readonly keyMaterial: string;
  private readonly roomCode: string;
  private readonly scope: SyncScope;
  private readonly relayUrl: string;
  private readonly passphrase?: string;
  private readonly onChange?: () => void;
  private readonly onState?: (s: SyncState) => void;

  private idb: IndexeddbPersistence | null = null;
  private ws: WebSocket | null = null;
  private key: CryptoKey | null = null;
  private room: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private networkBound = false;
  private syncEndFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private checkpointSent = false;
  private compacting = false;
  private persistenceDbName: string | null = null;
  private state: SyncState = { localLoaded: false, connected: false };

  constructor(opts: LocalFirstOptions) {
    this.appId = opts.appId;
    this.keyMaterial = opts.keyMaterial;
    this.roomCode = opts.roomCode;
    this.scope = opts.scope;
    this.relayUrl = opts.relayUrl;
    this.passphrase = opts.passphrase?.trim() || undefined;
    this.onChange = opts.onChange;
    this.onState = opts.onState;
    this._doc = new Y.Doc();
    this.bindDoc(this._doc);
    void this.start();
  }

  private onAfterTransaction = () => {
    this.onChange?.();
  };

  private bindDoc(doc: Y.Doc) {
    doc.on("afterTransaction", this.onAfterTransaction);
    doc.on("update", this.handleLocalUpdate);
  }

  private unbindDoc(doc: Y.Doc) {
    doc.off("afterTransaction", this.onAfterTransaction);
    doc.off("update", this.handleLocalUpdate);
  }

  private setState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    this.onState?.(this.state);
  }

  private async start() {
    this.key = await deriveChannelKey(this.roomCode, this.keyMaterial, this.passphrase);
    this.room = await deriveRoom(this.roomCode, this.appId, this.scope, this.passphrase);
    if (this.destroyed) return;

    await this.initPersistence(`${this.appId}:${this.scope}:${this.room}`);
    if (this.destroyed) return;
    this.bindNetworkListeners();
    this.connect();
  }

  /** Wake a reconnect the instant the tab regains connectivity / visibility, instead of
   *  waiting out the backoff timer. No-op if a live socket already exists. */
  private reconnectNow = () => {
    if (this.destroyed || !this.room) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.connect();
  };

  private handleVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      this.reconnectNow();
    }
  };

  private bindNetworkListeners() {
    if (this.networkBound || typeof window === "undefined") return;
    this.networkBound = true;
    window.addEventListener("online", this.reconnectNow);
    window.addEventListener("visibilitychange", this.handleVisibility);
  }

  private unbindNetworkListeners() {
    if (!this.networkBound || typeof window === "undefined") return;
    this.networkBound = false;
    window.removeEventListener("online", this.reconnectNow);
    window.removeEventListener("visibilitychange", this.handleVisibility);
  }

  private async initPersistence(dbName: string, attempt = 0): Promise<void> {
    await ensureIdbReady(dbName);
    if (this.destroyed) return;

    this.persistenceDbName = dbName;
    const persistence = new IndexeddbPersistence(dbName, this._doc);
    this.idb = persistence;
    persistence.on("synced", () => this.setState({ localLoaded: true }));

    try {
      type IdbPersistence = IndexeddbPersistence & { _db: Promise<IDBDatabase> };
      await (persistence as IdbPersistence)._db;
      await persistence.whenSynced;
    } catch {
      try {
        await persistence.clearData();
      } catch {
        await deleteIdbDatabase(dbName);
      }
      this.idb = null;
      if (attempt < 1) {
        await this.initPersistence(dbName, attempt + 1);
        return;
      }
      this.setState({ localLoaded: true });
    }
  }

  private connect() {
    if (this.destroyed || !this.room) return;
    const url = `${this.relayUrl}/sync?room=${encodeURIComponent(this.room)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    ws.binaryType = "arraybuffer";
    this.ws = ws;
    this.checkpointSent = false;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState({ connected: true });
      if (this.syncEndFallbackTimer) clearTimeout(this.syncEndFallbackTimer);
      this.syncEndFallbackTimer = setTimeout(() => {
        this.syncEndFallbackTimer = null;
        void this.sendCheckpoint();
      }, SYNC_END_FALLBACK_MS);
    };
    ws.onmessage = (ev) => void this.handleRemoteMessage(ev.data);
    ws.onclose = () => {
      this.setState({ connected: false });
      if (this.syncEndFallbackTimer) {
        clearTimeout(this.syncEndFallbackTimer);
        this.syncEndFallbackTimer = null;
      }
      this.scheduleReconnect();
    };
    ws.onerror = () => ws.close();
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return;
    // Offline: don't burn doomed connects on a fixed timer — the "online" listener wakes
    // us the instant connectivity returns.
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    // Exponential backoff with full jitter: a relay restart that drops every client at
    // once must not trigger a synchronized reconnect storm 2s later. Capped so a long
    // outage still retries promptly once.
    const ceiling = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** this.reconnectAttempts);
    const delay = Math.round(ceiling / 2 + Math.random() * (ceiling / 2));
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === REMOTE_ORIGIN || this.compacting) return;
    void this.send(update);
  };

  private async send(update: Uint8Array) {
    if (!this.key || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const blob = await encrypt(this.key, update);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frameUpdate(blob));
    }
  }

  private async sendCheckpoint() {
    if (this.checkpointSent || this.destroyed || !this.key) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.checkpointSent = true;
    if (this.syncEndFallbackTimer) {
      clearTimeout(this.syncEndFallbackTimer);
      this.syncEndFallbackTimer = null;
    }
    const update = Y.encodeStateAsUpdate(this._doc);
    const blob = await encrypt(this.key, update);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frameCheckpoint(blob));
    }
  }

  /**
   * Prune CRDT edit history after large inline payloads (e.g. images).
   * Rehydrates into a fresh Y.Doc and pushes a relay checkpoint.
   */
  async compactStorage(): Promise<CompactResult> {
    if (this.destroyed || this.compacting || !this.persistenceDbName) {
      return { before: 0, after: 0 };
    }

    this.compacting = true;
    const before = Y.encodeStateAsUpdate(this._doc).byteLength;
    const compacted = encodeCompactedState(this._doc);

    try {
      const oldDoc = this._doc;
      this.unbindDoc(oldDoc);

      if (this.idb) {
        await this.idb.destroy();
        this.idb = null;
      }

      const newDoc = new Y.Doc({ gc: true });
      Y.applyUpdate(newDoc, compacted);
      this.bindDoc(newDoc);
      oldDoc.destroy();
      this._doc = newDoc;

      const persistence = new IndexeddbPersistence(this.persistenceDbName, this._doc);
      this.idb = persistence;
      persistence.on("synced", () => this.setState({ localLoaded: true }));
      type IdbPersistence = IndexeddbPersistence & { _db: Promise<IDBDatabase> };
      await (persistence as IdbPersistence)._db;
      await persistence.whenSynced;

      const after = Y.encodeStateAsUpdate(this._doc).byteLength;
      this.checkpointSent = false;
      await this.sendCheckpoint();
      this.onChange?.();
      return { before, after };
    } finally {
      this.compacting = false;
    }
  }

  private async handleRemoteMessage(data: ArrayBuffer | Blob) {
    if (!this.key) return;
    const bytes =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(await data.arrayBuffer());

    const { type, payload, legacy } = unwrapFrame(bytes);
    if (type === MSG_SYNC_END) {
      void this.sendCheckpoint();
      return;
    }

    const encrypted = legacy ? bytes : payload;
    const plain = await decrypt(this.key, encrypted);
    if (!plain) return;
    Y.applyUpdate(this._doc, plain, REMOTE_ORIGIN);
  }

  getState(): SyncState {
    return this.state;
  }

  destroy() {
    this.destroyed = true;
    this.unbindNetworkListeners();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.syncEndFallbackTimer) clearTimeout(this.syncEndFallbackTimer);
    this.unbindDoc(this._doc);
    this.ws?.close();
    void this.idb?.destroy();
    this._doc.destroy();
  }
}
