import * as Y from "yjs";

/** Re-encode document state through a fresh Y.Doc with GC enabled. */
export function encodeCompactedState(doc: Y.Doc): Uint8Array {
  const snapshot = Y.encodeStateAsUpdate(doc);
  const clean = new Y.Doc({ gc: true });
  Y.applyUpdate(clean, snapshot);
  const compacted = Y.encodeStateAsUpdate(clean);
  clean.destroy();
  return compacted;
}
