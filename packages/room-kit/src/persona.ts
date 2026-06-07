/** Persona identity — X25519 keypair + contact card (no central server). */

const enc = new TextEncoder();

export interface ContactCard {
  v: 1;
  pk: string;
  name?: string;
  /** Emoji-only avatar JSON — photos sync via inbox instead. */
  avatar?: string;
}

export interface PersonaKeyMaterial {
  personaId: string;
  publicKey: string;
  privateKeyJwk: JsonWebKey;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function generatePersonaKeys(): Promise<PersonaKeyMaterial> {
  const pair = (await crypto.subtle.generateKey(
    { name: "X25519" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;
  const publicRaw = await crypto.subtle.exportKey("raw", pair.publicKey);
  const publicKey = bytesToB64url(new Uint8Array(publicRaw));
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { personaId: publicKey, publicKey, privateKeyJwk };
}

export async function importPersonaPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "X25519" }, true, ["deriveBits"]);
}

export async function importContactPublicKey(publicKey: string): Promise<CryptoKey> {
  const raw = b64urlToBytes(publicKey);
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "X25519" }, true, []);
}

export function encodeContactCard(card: ContactCard): string {
  return `rooms1.${bytesToB64url(enc.encode(JSON.stringify(card)))}`;
}

export function parseContactCard(raw: string): ContactCard | null {
  const t = raw.trim();
  if (!t) return null;

  const tryJson = (json: string): ContactCard | null => {
    try {
      const o = JSON.parse(json) as ContactCard;
      if (o?.v === 1 && typeof o.pk === "string" && o.pk.length >= 16) return o;
    } catch {
      return null;
    }
    return null;
  };

  if (t.startsWith("rooms1.")) {
    try {
      const json = new TextDecoder().decode(b64urlToBytes(t.slice(7)));
      return tryJson(json);
    } catch {
      return null;
    }
  }

  const fromJson = tryJson(t);
  if (fromJson) return fromJson;

  try {
    const json = new TextDecoder().decode(b64urlToBytes(t));
    return tryJson(json);
  } catch {
    return null;
  }
}

export function contactCardFromPersona(
  publicKey: string,
  displayName: string,
  avatar?: string,
): ContactCard {
  const card: ContactCard = { v: 1, pk: publicKey, name: displayName.trim() || undefined };
  if (avatar?.trim()) card.avatar = avatar.trim();
  return card;
}
