// End-to-end encryption for the Local-First Kit, built on the browser's
// native Web Crypto API (AES-256-GCM). Everything that leaves the device is
// encrypted with a key derived from the family's invite code, so the relay
// only ever sees opaque ciphertext.

const enc = new TextEncoder();

const normalize = (code: string) => code.trim().toLowerCase().replace(/\s+/g, " ");

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input) as BufferSource);
  return new Uint8Array(digest);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** AES-GCM key derived from the invite code. */
export async function deriveKey(inviteCode: string): Promise<CryptoKey> {
  const raw = await sha256("lfk-key:" + normalize(inviteCode));
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Opaque, unguessable relay room id derived from the same invite code. */
export async function deriveRoom(inviteCode: string): Promise<string> {
  const raw = await sha256("lfk-room:" + normalize(inviteCode));
  return toHex(raw.slice(0, 16));
}

/** Encrypt a CRDT update: output is iv(12) || ciphertext+tag. */
export async function encrypt(key: CryptoKey, plaintext: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  const ctBytes = new Uint8Array(ct);
  const out = new Uint8Array(iv.length + ctBytes.length);
  out.set(iv, 0);
  out.set(ctBytes, iv.length);
  return out;
}

/** Decrypt; returns null on any failure (wrong key, tampering, junk). */
export async function decrypt(key: CryptoKey, data: Uint8Array): Promise<Uint8Array | null> {
  if (data.length < 12 + 16) return null;
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
    return new Uint8Array(plain);
  } catch {
    return null;
  }
}
