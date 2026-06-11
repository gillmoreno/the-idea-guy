// Biometric vault unlock — WebAuthn platform authenticator + PRF extension.
//
// The authenticator's PRF output (stable per credential + salt, released only after
// FaceID/TouchID/Windows Hello user verification) derives an AES key via HKDF. That key
// wraps the raw Argon2id PIN-key bytes, so biometric unlock yields the exact same vault
// key as typing the PIN. The PIN always remains as fallback; nothing leaves the device.
//
// No server verifies these ceremonies — the assertion is only the gate the platform
// enforces before releasing the PRF secret — so challenges are random local bytes.

import type { VaultUnlockResult } from "./vaultLock";
import {
  b64ToBytes,
  bytesToB64,
  decryptVaultWithKey,
  readVaultCipherBytes,
  readVaultLockMeta,
  writeVaultLockMeta,
} from "./vaultLock";
import { decrypt, derivePinKeyBytes, encrypt, hkdfAesKey, importVaultKey } from "./crypto";

const PRF_INFO_LABEL = "lfk-vault-bio:v1";
const RP_NAME = "Rooms";

export type EnableBiometricResult = "ok" | "unsupported" | "wrong-pin" | "cancelled" | "failed";

function rand(len: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(len));
}

/** True when this browser/device has a user-verifying platform authenticator. */
export async function isBiometricUnlockAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isBiometricUnlockEnabled(): boolean {
  return Boolean(readVaultLockMeta()?.bio);
}

function prfResultFrom(cred: PublicKeyCredential | null): Uint8Array | null {
  const first = (cred?.getClientExtensionResults() as { prf?: { results?: { first?: unknown } } })
    ?.prf?.results?.first;
  if (!first) return null;
  return new Uint8Array(first as ArrayBuffer);
}

async function assertPrfSecret(credentialIdB64: string, prfSaltB64: string): Promise<Uint8Array | null> {
  try {
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: rand(32) as BufferSource,
        allowCredentials: [
          { type: "public-key", id: b64ToBytes(credentialIdB64) as BufferSource },
        ],
        userVerification: "required",
        timeout: 60_000,
        extensions: {
          prf: { eval: { first: b64ToBytes(prfSaltB64) as BufferSource } },
        } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;
    return prfResultFrom(cred);
  } catch {
    return null; // cancelled, timed out, or credential gone
  }
}

/**
 * Enroll FaceID/TouchID/Windows Hello as a second unlock path.
 * Requires the current PIN (the wrap covers the PIN-derived key) and an unlocked-capable cipher.
 */
export async function enableBiometricUnlock(pin: string): Promise<EnableBiometricResult> {
  if (!(await isBiometricUnlockAvailable())) return "unsupported";
  const meta = readVaultLockMeta();
  if (!meta) return "failed";

  // Verify the PIN by decrypting the real cipher — the same bytes we are about to wrap.
  const pinKeyBytes = await derivePinKeyBytes(pin.trim(), meta.salt);
  const pinKey = await importVaultKey(pinKeyBytes);
  const cipher = readVaultCipherBytes();
  if (!cipher || !(await decrypt(pinKey, cipher))) return "wrong-pin";

  const prfSalt = rand(32);
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.create({
      publicKey: {
        rp: { name: RP_NAME },
        user: {
          id: rand(16) as BufferSource,
          name: "rooms-vault",
          displayName: "Rooms on this device",
        },
        challenge: rand(32) as BufferSource,
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        attestation: "none",
        timeout: 60_000,
        extensions: {
          prf: { eval: { first: prfSalt as BufferSource } },
        } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;
  } catch {
    return "cancelled";
  }
  if (!credential) return "failed";

  const credentialId = bytesToB64(new Uint8Array(credential.rawId));
  const prfSaltB64 = bytesToB64(prfSalt);

  // Chrome evaluates PRF at create(); Safari may only report `enabled` and needs a get().
  let prfSecret = prfResultFrom(credential);
  if (!prfSecret) prfSecret = await assertPrfSecret(credentialId, prfSaltB64);
  if (!prfSecret) return "unsupported"; // authenticator without PRF — keep PIN-only

  const bioKey = await hkdfAesKey(prfSecret, PRF_INFO_LABEL);
  const wrappedKey = await encrypt(bioKey, pinKeyBytes);
  writeVaultLockMeta({
    ...meta,
    bio: { credentialId, prfSalt: prfSaltB64, wrappedKey: bytesToB64(wrappedKey) },
  });
  return "ok";
}

/** Unlock via biometric prompt. Returns null if cancelled, unenrolled, or decryption fails. */
export async function unlockVaultWithBiometric(): Promise<VaultUnlockResult | null> {
  const meta = readVaultLockMeta();
  if (!meta?.bio) return null;

  const prfSecret = await assertPrfSecret(meta.bio.credentialId, meta.bio.prfSalt);
  if (!prfSecret) return null;

  const bioKey = await hkdfAesKey(prfSecret, PRF_INFO_LABEL);
  const pinKeyBytes = await decrypt(bioKey, b64ToBytes(meta.bio.wrappedKey));
  if (!pinKeyBytes) return null;

  const key = await importVaultKey(pinKeyBytes);
  const vault = await decryptVaultWithKey(key);
  if (!vault) return null;
  return { vault, key };
}

/** Drop biometric enrollment — the PIN keeps working, the platform credential is simply unused. */
export function disableBiometricUnlock(): void {
  const meta = readVaultLockMeta();
  if (!meta?.bio) return;
  const { bio: _bio, ...rest } = meta;
  writeVaultLockMeta(rest);
}
