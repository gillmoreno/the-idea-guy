// End-to-end encryption for the Local-First Kit (Web Crypto AES-256-GCM).

const enc = new TextEncoder();

const normalize = (s: string) => s.trim();

/** Argon2id params — tuned for browser (fast enough on mobile, slow enough for passphrases). */
const ARGON2_MEMORY = 65536; // 64 MiB
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LEN = 32;

async function sha256(input: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return new Uint8Array(digest);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function argon2Derive(
  password: Uint8Array,
  saltLabel: string,
): Promise<Uint8Array> {
  const { argon2id } = await import("hash-wasm");
  const salt = await sha256(saltLabel);
  const digest = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY,
    hashLength: ARGON2_HASH_LEN,
    outputType: "binary",
  });
  return new Uint8Array(digest);
}

function passphrasePassword(roomCode: string, passphrase: string): Uint8Array {
  return enc.encode(`${normalize(roomCode)}\0${normalize(passphrase)}`);
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
 * Derive AES key for a room channel.
 * Uses Argon2id when a passphrase is set; legacy SHA-256 otherwise (existing rooms).
 */
export async function deriveChannelKey(
  roomCode: string,
  keyMaterial: string,
  passphrase?: string,
): Promise<CryptoKey> {
  if (passphrase?.trim()) {
    const raw = await argon2Derive(
      passphrasePassword(roomCode, passphrase),
      `lfk-argon-key:v1:${normalize(keyMaterial)}`,
    );
    return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  }
  return deriveKey(keyMaterial);
}

/**
 * Relay room id — unique per app + room + channel (public vs admin).
 * Uses Argon2id when passphrase is set so ciphertext cannot be fetched without it.
 */
export async function deriveRoom(
  roomCode: string,
  appId: string,
  scope: SyncScope,
  passphrase?: string,
): Promise<string> {
  if (passphrase?.trim()) {
    const raw = await argon2Derive(
      passphrasePassword(roomCode, passphrase),
      `lfk-argon-room:v1:${normalize(appId)}:${scope}:${normalize(roomCode)}`,
    );
    return toHex(raw.slice(0, 16));
  }
  const raw = await sha256(
    "lfk-room:" + normalize(appId) + ":" + scope + ":" + normalize(roomCode),
  );
  return toHex(raw.slice(0, 16));
}

/** @deprecated Use deriveChannelKey + deriveRoom with optional passphrase. */
export async function deriveChannelRoom(
  roomCode: string,
  appId: string,
  scope: SyncScope,
  passphrase?: string,
): Promise<string> {
  return deriveRoom(roomCode, appId, scope, passphrase);
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

/** Raw Argon2id bytes behind the vault PIN key — wrapped at rest for biometric unlock. */
export async function derivePinKeyBytes(pin: string, saltHex: string): Promise<Uint8Array> {
  return argon2Derive(enc.encode(normalize(pin)), `lfk-vault-pin:v1:${saltHex}`);
}

/** Import 32 raw bytes as a non-extractable AES-GCM vault key. */
export async function importVaultKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Derive a key from a PIN + salt (vault lock). */
export async function derivePinKey(pin: string, saltHex: string): Promise<CryptoKey> {
  return importVaultKey(await derivePinKeyBytes(pin, saltHex));
}

/** AES-GCM key from a high-entropy secret (e.g. WebAuthn PRF output) via HKDF-SHA256. */
export async function hkdfAesKey(secret: Uint8Array, infoLabel: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", secret as BufferSource, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode(infoLabel) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
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

export function randomSaltHex(): string {
  const buf = crypto.getRandomValues(new Uint8Array(16));
  return toHex(buf);
}

export { toHex, sha256 };
