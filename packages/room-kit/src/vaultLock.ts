import type { DeviceVault } from "./types";
import { decrypt, derivePinKey, encrypt, randomSaltHex } from "./crypto";

const VAULT_KEY = "rooms.vault.v1";
const VAULT_CIPHER_KEY = "rooms.vault.v1.cipher";
const VAULT_LOCK_KEY = "rooms.vault.v1.lock";

/** Biometric (WebAuthn PRF) unlock material — the PRF-derived key wraps the PIN-derived vault key. */
export interface VaultBioMeta {
  /** Base64 credential rawId of the platform authenticator. */
  credentialId: string;
  /** Base64 PRF eval salt (not secret). */
  prfSalt: string;
  /** Base64 AES-GCM ciphertext of the raw PIN-derived key bytes, under the PRF-derived key. */
  wrappedKey: string;
}

export interface VaultLockMeta {
  enabled: boolean;
  salt: string;
  /** Base64 ciphertext of a known verifier string — checked on unlock. */
  verifier: string;
  /** Present when biometric unlock is enrolled; dropped whenever the PIN/salt changes. */
  bio?: VaultBioMeta;
}

/** Unlocked vault plus the AES key that decrypted it — held in session for re-encryption on save. */
export interface VaultUnlockResult {
  vault: DeviceVault;
  key: CryptoKey;
}

const VERIFIER_PLAINTEXT = "rooms-vault-unlock-v1";

export function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function readVaultLockMeta(): VaultLockMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VAULT_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultLockMeta;
    if (!parsed.enabled || !parsed.salt || !parsed.verifier) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeVaultLockMeta(meta: VaultLockMeta): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_LOCK_KEY, JSON.stringify(meta));
}

export function isVaultLockEnabled(): boolean {
  return readVaultLockMeta()?.enabled === true;
}

export function readPlainVaultJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VAULT_KEY);
}

export function writePlainVaultJson(json: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEY, json);
}

export function readVaultCipherBytes(): Uint8Array | null {
  if (typeof window === "undefined") return null;
  const b64 = localStorage.getItem(VAULT_CIPHER_KEY);
  return b64 ? b64ToBytes(b64) : null;
}

async function buildVerifier(salt: string, pin: string): Promise<string> {
  const key = await derivePinKey(pin, salt);
  const ct = await encrypt(key, new TextEncoder().encode(VERIFIER_PLAINTEXT));
  return bytesToB64(ct);
}

async function checkPin(salt: string, verifierB64: string, pin: string): Promise<boolean> {
  const key = await derivePinKey(pin, salt);
  const plain = await decrypt(key, b64ToBytes(verifierB64));
  if (!plain) return false;
  return new TextDecoder().decode(plain) === VERIFIER_PLAINTEXT;
}

/** Decrypt the stored vault cipher with an already-derived key. */
export async function decryptVaultWithKey(key: CryptoKey): Promise<DeviceVault | null> {
  const cipher = readVaultCipherBytes();
  if (!cipher) return null;
  const plain = await decrypt(key, cipher);
  if (!plain) return null;
  try {
    return JSON.parse(new TextDecoder().decode(plain)) as DeviceVault;
  } catch {
    return null;
  }
}

/**
 * Enable PIN lock and encrypt the current vault.
 * Returns the vault key for the session, or null on failure.
 */
export async function enableVaultLock(pin: string, vault: DeviceVault): Promise<CryptoKey | null> {
  if (typeof window === "undefined") return null;
  const trimmed = pin.trim();
  if (trimmed.length < 4) return null;

  const salt = randomSaltHex();
  const verifier = await buildVerifier(salt, trimmed);
  const key = await derivePinKey(trimmed, salt);
  const json = JSON.stringify(vault);
  const ct = await encrypt(key, new TextEncoder().encode(json));

  // Fresh meta never carries `bio` — a new salt invalidates any old biometric wrap.
  const meta: VaultLockMeta = { enabled: true, salt, verifier };
  writeVaultLockMeta(meta);
  localStorage.setItem(VAULT_CIPHER_KEY, bytesToB64(ct));
  localStorage.removeItem(VAULT_KEY);
  return key;
}

/** Decrypt vault with PIN. Returns null on wrong PIN. */
export async function unlockVaultWithPin(pin: string): Promise<VaultUnlockResult | null> {
  const meta = readVaultLockMeta();
  if (!meta) return null;
  const ok = await checkPin(meta.salt, meta.verifier, pin);
  if (!ok) return null;

  const key = await derivePinKey(pin.trim(), meta.salt);
  const vault = await decryptVaultWithKey(key);
  if (!vault) return null;
  return { vault, key };
}

/** Re-encrypt vault after changes while lock is enabled. */
export async function persistLockedVault(key: CryptoKey, vault: DeviceVault): Promise<boolean> {
  const meta = readVaultLockMeta();
  if (!meta?.enabled) {
    writePlainVaultJson(JSON.stringify(vault));
    return true;
  }
  const ct = await encrypt(key, new TextEncoder().encode(JSON.stringify(vault)));
  localStorage.setItem(VAULT_CIPHER_KEY, bytesToB64(ct));
  return true;
}

/** Disable PIN lock — requires correct PIN. Vault returned in plaintext storage. */
export async function disableVaultLock(pin: string): Promise<DeviceVault | null> {
  const unlocked = await unlockVaultWithPin(pin);
  if (!unlocked) return null;
  localStorage.removeItem(VAULT_LOCK_KEY);
  localStorage.removeItem(VAULT_CIPHER_KEY);
  writePlainVaultJson(JSON.stringify(unlocked.vault));
  return unlocked.vault;
}

/** Change PIN — requires current PIN. Drops biometric enrollment (key material rotates). */
export async function changeVaultPin(
  currentPin: string,
  newPin: string,
  vault: DeviceVault,
): Promise<boolean> {
  const unlocked = await unlockVaultWithPin(currentPin);
  if (!unlocked) return false;
  localStorage.removeItem(VAULT_LOCK_KEY);
  localStorage.removeItem(VAULT_CIPHER_KEY);
  writePlainVaultJson(JSON.stringify(vault));
  return (await enableVaultLock(newPin, vault)) !== null;
}
