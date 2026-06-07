import { parseDeepLink } from "@the-idea-guy/room-kit";

const PREFIX = "choreboard.memberSecret.";

export function setMemberSecret(memberId: string, secret: string) {
  localStorage.setItem(PREFIX + memberId, secret);
}

export function getMemberSecret(memberId: string): string | null {
  return localStorage.getItem(PREFIX + memberId);
}

export function clearMemberSecrets() {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}

/** Paste from parent when linking this device to a kid profile */
export function parseMemberLink(raw: string): { memberId: string; memberSecret: string } | null {
  const deep = parseDeepLink(raw);
  if (deep?.type === "member") return parseMemberLink(deep.link);
  try {
    const json = atob(raw.trim().replace(/-/g, "+").replace(/_/g, "/"));
    const o = JSON.parse(json) as { memberId?: string; memberSecret?: string };
    if (o.memberId && o.memberSecret) return { memberId: o.memberId, memberSecret: o.memberSecret };
  } catch {
    /* try plain json */
    try {
      const o = JSON.parse(raw.trim()) as { memberId?: string; memberSecret?: string };
      if (o.memberId && o.memberSecret) return { memberId: o.memberId, memberSecret: o.memberSecret };
    } catch {
      return null;
    }
  }
  return null;
}

export function formatMemberLink(memberId: string, memberSecret: string): string {
  return btoa(JSON.stringify({ memberId, memberSecret }));
}
