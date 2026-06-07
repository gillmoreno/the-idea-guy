// LocalFirstDoc — Yjs + IndexedDB + E2E-encrypted sync over the relay.
import { Y } from "./yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { deriveKey, deriveRoom, encrypt, decrypt, type SyncScope } from "./crypto";
import { deleteIdbDatabase, ensureIdbReady } from "./persistence";
import {
  frameCheckpoint,
  frameUpdate,
  MSG_SYNC_END,
  unwrapFrame,
} from "./relayProtocol";

const REMOTE_ORIGIN = "remote";
const SYNC_END_FALLBACK_MS = 1500;

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
  onChange?: () => void;
  onState?: (state: SyncState) => void;
}

export class LocalFirstDoc {
  readonly doc: Y.Doc;
  private readonly appId: string;
  private readonly keyMaterial: string;
  private readonly roomCode: string;
  private readonly scope: SyncScope;
  private readonly relayUrl: string;
  private readonly onChange?: () => void;
  private readonly onState?: (s: SyncState) => void;

  private idb: IndexeddbPersistence | null = null;
  private ws: WebSocket | null = null;
  private key: CryptoKey | null = null;
  private room: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private syncEndFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private checkpointSent = false;
  private state: SyncState = { localLoaded: false, connected: false };

  constructor(opts: LocalFirstOptions) {
    this.appId = opts.appId;
    this.keyMaterial = opts.keyMaterial;
    this.roomCode = opts.roomCode;
    this.scope = opts.scope;
    this.relayUrl = opts.relayUrl;
    this.onChange = opts.onChange;
    this.onState = opts.onState;
    this.doc = new Y.Doc();
    this.doc.on("afterTransaction", () => this.onChange?.());
    this.doc.on("update", this.handleLocalUpdate);
    void this.start();
  }

  private setState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    this.onState?.(this.state);
  }

  private async start() {
    this.key = await deriveKey(this.keyMaterial);
    this.room = await deriveRoom(this.roomCode, this.appId, this.scope);
    if (this.destroyed) return;

    await this.initPersistence(`${this.appId}:${this.scope}:${this.room}`);
    if (this.destroyed) return;
    this.connect();
  }

  private async initPersistence(dbName: string, attempt = 0): Promise<void> {
    await ensureIdbReady(dbName);
    if (this.destroyed) return;

    const persistence = new IndexeddbPersistence(dbName, this.doc);
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
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === REMOTE_ORIGIN) return;
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
    const update = Y.encodeStateAsUpdate(this.doc);
    const blob = await encrypt(this.key, update);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frameCheckpoint(blob));
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
    Y.applyUpdate(this.doc, plain, REMOTE_ORIGIN);
  }

  getState(): SyncState {
    return this.state;
  }

  destroy() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.syncEndFallbackTimer) clearTimeout(this.syncEndFallbackTimer);
    this.doc.off("update", this.handleLocalUpdate);
    this.ws?.close();
    void this.idb?.destroy();
    this.doc.destroy();
  }
}
