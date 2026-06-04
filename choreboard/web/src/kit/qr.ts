/** QR / invite links — HTTPS so any camera app opens the PWA (not choreboard://). */

const PROD_ORIGIN = "https://chores.the-idea-guy.com";

export function appOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? PROD_ORIGIN;
}

function appQuery(params: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `${appOrigin()}/?${s}` : `${appOrigin()}/`;
}

export function qrFamilyJoin(familyCode: string): string {
  return appQuery({ join: familyCode.trim() });
}

export function qrParentUnlock(parentSecret: string): string {
  return appQuery({ parent: parentSecret.trim() });
}

export function qrMemberLink(link: string): string {
  return appQuery({ member: link.trim() });
}

export type DeepLink = { type: "join" | "parent" | "member"; value: string };

export function parseJoinFromUrl(search: string): string | null {
  const d = parseAppSearchParams(search);
  return d?.type === "join" ? d.value : null;
}

export function parseAppSearchParams(search: string): DeepLink | null {
  const params = new URLSearchParams(search);
  const join = params.get("join") ?? params.get("family");
  if (join) return { type: "join", value: decodeURIComponent(join) };
  const parent = params.get("parent");
  if (parent) return { type: "parent", value: decodeURIComponent(parent) };
  const member = params.get("member");
  if (member) return { type: "member", value: decodeURIComponent(member) };
  const chore = params.get("choreboard");
  if (chore?.startsWith("join:")) return { type: "join", value: chore.slice(5) };
  return null;
}

/** Strip invite params from the address bar (secrets must not linger in history). */
export function stripInviteParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["join", "family", "parent", "member", "choreboard"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    const tail = url.searchParams.toString();
    window.history.replaceState({}, "", tail ? `${url.pathname}?${tail}` : url.pathname);
  }
}

export function parseDeepLink(raw: string): DeepLink | null {
  const s = raw.trim();
  if (!s) return null;

  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      return parseAppSearchParams(u.search);
    } catch {
      return null;
    }
  }

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
