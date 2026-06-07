/** Invite / deep links for the Rooms meta-app. Secrets in hash when possible. */

import { DEFAULT_APP_URL } from "./constants";

export function appOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return DEFAULT_APP_URL;
}

export function roomUrl(roomCode: string): string {
  const code = encodeURIComponent(roomCode.trim());
  return `${appOrigin()}/room?c=${code}`;
}

export function memberJoinUrl(roomCode: string): string {
  return `${appOrigin()}/join?code=${encodeURIComponent(roomCode.trim())}`;
}

export function adminJoinUrl(roomCode: string, adminSecret: string, templateId?: string): string {
  const base = `${appOrigin()}/join`;
  const q = new URLSearchParams({ code: roomCode.trim() });
  if (templateId) q.set("template", templateId);
  return `${base}?${q.toString()}#admin=${encodeURIComponent(adminSecret.trim())}`;
}

export type DeepLink =
  | { type: "join"; roomCode: string; adminSecret?: string; templateId?: string }
  | { type: "member"; link: string };

export function parseJoinLocation(search: string, hash: string): DeepLink | null {
  const params = new URLSearchParams(search);
  const roomCode = params.get("code") ?? params.get("join") ?? params.get("c");
  if (!roomCode) return null;

  let adminSecret: string | undefined;
  if (hash.startsWith("#")) {
    const h = new URLSearchParams(hash.slice(1));
    adminSecret = h.get("admin") ?? undefined;
  }
  const templateId = params.get("template") ?? undefined;
  return { type: "join", roomCode: decodeURIComponent(roomCode), adminSecret, templateId };
}

export function parseDeepLink(raw: string): DeepLink | null {
  const s = raw.trim();
  if (!s) return null;

  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      const member = u.searchParams.get("member");
      if (member) return { type: "member", link: decodeURIComponent(member) };
      const fromLoc = parseJoinLocation(u.search, u.hash);
      if (fromLoc) return fromLoc;
    } catch {
      return null;
    }
  }

  // Bare room code paste
  if (!s.includes(" ") && s.length >= 8) {
    return { type: "join", roomCode: s };
  }

  return null;
}

/** Strip invite params from the address bar (admin secret must not linger in history). */
export function stripInviteParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["code", "join", "c", "template", "admin"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (url.hash.includes("admin=")) {
    url.hash = "";
    changed = true;
  }
  if (changed) {
    const tail = url.searchParams.toString();
    window.history.replaceState({}, "", tail ? `${url.pathname}?${tail}` : url.pathname);
  }
}

/** @deprecated ChoreBoard-era helpers */
export function qrFamilyJoin(roomCode: string): string {
  return memberJoinUrl(roomCode);
}

export function qrParentUnlock(adminSecret: string): string {
  return `${appOrigin()}/join#admin=${encodeURIComponent(adminSecret.trim())}`;
}

export function parseJoinFromUrl(search: string): string | null {
  const d = parseJoinLocation(search, "");
  return d?.type === "join" ? d.roomCode : null;
}

export function parseAppSearchParams(search: string): { type: string; value: string } | null {
  const d = parseJoinLocation(search, "");
  if (d?.type === "join") return { type: "join", value: d.roomCode };
  return null;
}

export function qrMemberLink(link: string): string {
  return `${appOrigin()}/join?member=${encodeURIComponent(link.trim())}`;
}

export function parseDeepLinkLegacy(raw: string): { type: "join" | "parent" | "member"; value: string } | null {
  const d = parseDeepLink(raw);
  if (d?.type === "join") return { type: "join", value: d.roomCode };
  return null;
}
