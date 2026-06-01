/** Payloads encoded in QR codes (plain text — scan with any camera app). */

export function qrFamilyJoin(familyCode: string): string {
  return `choreboard://join?family=${encodeURIComponent(familyCode.trim())}`;
}

export function qrParentUnlock(parentSecret: string): string {
  return `choreboard://parent?secret=${encodeURIComponent(parentSecret.trim())}`;
}

export function qrMemberLink(link: string): string {
  return `choreboard://member?link=${encodeURIComponent(link.trim())}`;
}

export function parseJoinFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  const join = params.get("join") ?? params.get("family");
  if (join) return decodeURIComponent(join);
  const chore = params.get("choreboard");
  if (chore?.startsWith("join:")) return chore.slice(5);
  return null;
}

export function parseDeepLink(raw: string): {
  type: "join" | "parent" | "member";
  value: string;
} | null {
  const s = raw.trim();
  if (s.startsWith("choreboard://join")) {
    const u = new URL(s.replace("choreboard://", "https://x/"));
    const family = u.searchParams.get("family");
    if (family) return { type: "join", value: decodeURIComponent(family) };
  }
  if (s.startsWith("choreboard://parent")) {
    const u = new URL(s.replace("choreboard://", "https://x/"));
    const secret = u.searchParams.get("secret");
    if (secret) return { type: "parent", value: decodeURIComponent(secret) };
  }
  if (s.startsWith("choreboard://member")) {
    const u = new URL(s.replace("choreboard://", "https://x/"));
    const link = u.searchParams.get("link");
    if (link) return { type: "member", value: decodeURIComponent(link) };
  }
  return null;
}
