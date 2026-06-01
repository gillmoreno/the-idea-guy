// Family and member secrets. Uses crypto.getRandomValues — not Math.random.

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

/** Family invite — share with kids to join (sync + read catalog, post completions). */
export function generateFamilyCode(): string {
  return generateSecret(16);
}

/** Parent-only — never give to kids. Unlocks admin data (chores, payday, settings). */
export function generateParentSecret(): string {
  return generateSecret(16);
}

/** Per-member — link one kid's device so only they can sign their completions. */
export function generateMemberSecret(): string {
  return generateSecret(12);
}

/** @deprecated Use generateFamilyCode */
export function generateInviteCode(): string {
  return generateFamilyCode();
}
