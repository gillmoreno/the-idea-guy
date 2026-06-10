import type { DeviceVault } from "./types";
import { decrypt, derivePinKey, encrypt, randomSaltHex } from "./crypto";

const VAULT_KEY = "rooms.vault.v1";
const VAULT_CIPHER_KEY = "rooms.vault.v1.cipher";
const VAULT_LOCK_KEY = "rooms.vault.v1.lock";

export interface VaultLockMeta {
  enabled: boolean;
  salt: string;
  /** Base64 ciphertext of a known verifier string — checked on unlock. */
  verifier: string;
}

const VERIFIER_PLAINTEXT = "rooms-vault-unlock-v1";

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
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

/** Enable PIN lock and encrypt the current vault. Returns false if PIN verification fails internally. */
export async function enableVaultLock(pin: string, vault: DeviceVault): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const trimmed = pin.trim();
  if (trimmed.length < 4) return false;

  const salt = randomSaltHex();
  const verifier = await buildVerifier(salt, trimmed);
  const key = await derivePinKey(trimmed, salt);
  const json = JSON.stringify(vault);
  const ct = await encrypt(key, new TextEncoder().encode(json));

  const meta: VaultLockMeta = { enabled: true, salt, verifier };
  localStorage.setItem(VAULT_LOCK_KEY, JSON.stringify(meta));
  localStorage.setItem(VAULT_CIPHER_KEY, bytesToB64(ct));
  localStorage.removeItem(VAULT_KEY);
  return true;
}

/** Decrypt vault with PIN. Returns null on wrong PIN. */
export async function unlockVaultWithPin(pin: string): Promise<DeviceVault | null> {
  const meta = readVaultLockMeta();
  if (!meta) return null;
  const ok = await checkPin(meta.salt, meta.verifier, pin);
  if (!ok) return null;

  const cipherB64 = localStorage.getItem(VAULT_CIPHER_KEY);
  if (!cipherB64) return null;

  const key = await derivePinKey(pin.trim(), meta.salt);
  const plain = await decrypt(key, b64ToBytes(cipherB64));
  if (!plain) return null;

  try {
    return JSON.parse(new TextDecoder().decode(plain)) as DeviceVault;
  } catch {
    return null;
  }
}

/** Re-encrypt vault after changes while lock is enabled. */
export async function persistLockedVault(pin: string, vault: DeviceVault): Promise<boolean> {
  const meta = readVaultLockMeta();
  if (!meta?.enabled) {
    writePlainVaultJson(JSON.stringify(vault));
    return true;
  }
  const ok = await checkPin(meta.salt, meta.verifier, pin);
  if (!ok) return false;
  const key = await derivePinKey(pin.trim(), meta.salt);
  const ct = await encrypt(key, new TextEncoder().encode(JSON.stringify(vault)));
  localStorage.setItem(VAULT_CIPHER_KEY, bytesToB64(ct));
  return true;
}

/** Disable PIN lock — requires correct PIN. Vault returned in plaintext storage. */
export async function disableVaultLock(pin: string): Promise<DeviceVault | null> {
  const vault = await unlockVaultWithPin(pin);
  if (!vault) return null;
  localStorage.removeItem(VAULT_LOCK_KEY);
  localStorage.removeItem(VAULT_CIPHER_KEY);
  writePlainVaultJson(JSON.stringify(vault));
  return vault;
}

/** Change PIN — requires current PIN. */
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
  return enableVaultLock(newPin, vault);
}
