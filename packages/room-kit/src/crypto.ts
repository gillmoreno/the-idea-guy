// End-to-end encryption for the Local-First Kit (Web Crypto AES-256-GCM).

const enc = new TextEncoder();

const normalize = (s: string) => s.trim();

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input) as BufferSource);
  return new Uint8Array(digest);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Symmetric key from arbitrary secret material (room code, admin secret, etc.). */
export async function deriveKey(material: string): Promise<CryptoKey> {
  const raw = await sha256("lfk-key:" + normalize(material));
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Relay room id — unique per app + room + channel (public vs admin).
 * Members only connect to the `public` room; they never see admin ciphertext.
 */
export async function deriveRoom(
  roomCode: string,
  appId: string,
  scope: SyncScope,
): Promise<string> {
  const raw = await sha256(
    "lfk-room:" + normalize(appId) + ":" + scope + ":" + normalize(roomCode),
  );
  return toHex(raw.slice(0, 16));
}

export type SyncScope = "public" | "admin";

/** Admin channel key: requires room code + admin secret (never on member-only devices). */
export function adminKeyMaterial(roomCode: string, adminSecret: string): string {
  return `lfk-admin:${normalize(roomCode)}:${normalize(adminSecret)}`;
}

/** Public channel key: room code only. */
export function publicKeyMaterial(roomCode: string): string {
  return `lfk-public:${normalize(roomCode)}`;
}

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
