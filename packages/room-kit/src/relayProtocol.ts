// Wire framing for the Local-First relay (opaque payloads stay encrypted).

/** Incremental Yjs update — append to room log. */
export const MSG_UPDATE = 0x00;

/** Full merged snapshot — relay compacts the room log to this single frame. */
export const MSG_CHECKPOINT = 0x01;

/** Relay → client: backlog replay finished; client may send MSG_CHECKPOINT. */
export const MSG_SYNC_END = 0xfe;

export function frameUpdate(encrypted: Uint8Array): Uint8Array {
  const out = new Uint8Array(1 + encrypted.length);
  out[0] = MSG_UPDATE;
  out.set(encrypted, 1);
  return out;
}

export function frameCheckpoint(encrypted: Uint8Array): Uint8Array {
  const out = new Uint8Array(1 + encrypted.length);
  out[0] = MSG_CHECKPOINT;
  out.set(encrypted, 1);
  return out;
}

export function unwrapFrame(data: Uint8Array): {
  type: number;
  payload: Uint8Array;
  legacy: boolean;
} {
  if (data.length === 0) return { type: -1, payload: data, legacy: true };
  const tag = data[0];
  if (tag === MSG_UPDATE || tag === MSG_CHECKPOINT) {
    return { type: tag, payload: data.subarray(1), legacy: false };
  }
  if (tag === MSG_SYNC_END) {
    return { type: MSG_SYNC_END, payload: new Uint8Array(0), legacy: false };
  }
  return { type: -1, payload: data, legacy: true };
}
