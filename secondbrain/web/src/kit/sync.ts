// LocalFirstDoc — the reusable sync engine of the Local-First Kit.
//
// A Yjs document that:
//   - persists to IndexedDB (works fully offline),
//   - syncs across devices through the thin relay,
//   - encrypts every byte that leaves the device end-to-end.
//
// Apps just call `new LocalFirstDoc(...)`, read/write the shared types on
// `.doc`, and subscribe to `onChange`. No app logic lives here.
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { deriveKey, deriveRoom, encrypt, decrypt } from "./crypto";
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
  inviteCode: string;
  relayUrl: string;
  onChange?: () => void;
  onState?: (state: SyncState) => void;
}

export class LocalFirstDoc {
  readonly doc: Y.Doc;
  private readonly appId: string;
  private readonly inviteCode: string;
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
    this.inviteCode = opts.inviteCode;
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
    this.key = await deriveKey(this.inviteCode);
    this.room = await deriveRoom(this.inviteCode);
    if (this.destroyed) return;

    this.idb = new IndexeddbPersistence(`${this.appId}:${this.room}`, this.doc);
    this.idb.on("synced", () => this.setState({ localLoaded: true }));

    this.connect();
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
