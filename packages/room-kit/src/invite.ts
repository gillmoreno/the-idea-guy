// Room and member secrets. Uses crypto.getRandomValues — not Math.random.

const B64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** 16 bytes → ~128 bits of entropy, URL-safe (22 chars). */
export function generateSecret(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    out += B64URL[buf[i] & 63];
  }
  return out;
}

/** Room invite — share with members to sync shared data. */
export function generateRoomCode(): string {
  return generateSecret(16);
}

/** Admin-only — unlocks admin channel (settings, roles, protected config). */
export function generateAdminSecret(): string {
  return generateSecret(16);
}

/** Per-member — link one profile's device for signed actions. */
export function generateMemberSecret(): string {
  return generateSecret(12);
}

export function generateMemberId(): string {
  return "m_" + generateSecret(8);
}

/** @deprecated Use generateRoomCode */
export function generateFamilyCode(): string {
  return generateRoomCode();
}

/** @deprecated Use generateAdminSecret */
export function generateParentSecret(): string {
  return generateAdminSecret();
}
