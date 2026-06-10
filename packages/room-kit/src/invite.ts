// Room and member secrets. Uses crypto.getRandomValues — not Math.random.

/** 16 bytes → 128 bits of entropy, URL-safe base64url (22 chars). */
export function generateSecret(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
