// Per-member HMAC — members sign actions; admins verify before approving.
// Member secret stays on linked devices only (never in the relay).

const enc = new TextEncoder();

async function hmacKey(memberSecret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode("lfk-member:" + memberSecret));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Payload bound to a completion so it cannot be replayed for another chore/member. */
export function completionSignPayload(c: {
  id: string;
  memberId: string;
  choreId?: string;
  amount: number;
  date: string;
}): string {
  return [c.id, c.memberId, c.choreId ?? "", String(c.amount), c.date].join("|");
}

export async function signCompletion(
  memberSecret: string,
  payload: string,
): Promise<string> {
  const key = await hmacKey(memberSecret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifyCompletionSignature(
  memberSecret: string,
  payload: string,
  sigB64: string | undefined,
): Promise<boolean> {
  if (!sigB64) return false;
  try {
    const key = await hmacKey(memberSecret);
    const raw = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, raw, enc.encode(payload));
  } catch {
    return false;
  }
}
