import { Y } from "./yjs";

/** Stable fingerprint of merged Yjs state — used for background-update badges. */
export async function hashDocState(doc: Y.Doc): Promise<string> {
  const sv = Y.encodeStateVector(doc);
  const digest = await crypto.subtle.digest("SHA-256", sv as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
