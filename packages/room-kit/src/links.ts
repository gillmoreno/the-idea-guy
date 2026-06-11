/** Invite / deep links for the Rooms meta-app. Secrets live in the URL hash (never sent to CDN logs). */

import { DEFAULT_APP_URL } from "./constants";

export function appOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return DEFAULT_APP_URL;
}

function hashLink(path: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) sp.set(key, value.trim());
  }
  const qs = sp.toString();
  return qs ? `${appOrigin()}${path}#${qs}` : `${appOrigin()}${path}`;
}

/** Add-me contact link — contact card in hash only, so phone cameras open the app directly. */
export function contactAddUrl(contactCard: string): string {
  return `${appOrigin()}/contacts#${contactCard.trim()}`;
}

/** Open an existing room — room code in hash only. */
export function roomUrl(roomCode: string): string {
  return hashLink("/room", { c: roomCode.trim() });
}

/** Member invite — room code in hash only. */
export function memberJoinUrl(roomCode: string): string {
  return hashLink("/join", { c: roomCode.trim() });
}

/** Admin invite — room code + admin secret + optional template, all in hash. */
export function adminJoinUrl(roomCode: string, adminSecret: string, templateId?: string): string {
  return hashLink("/join", {
    c: roomCode.trim(),
    admin: adminSecret.trim(),
    template: templateId,
  });
}

export type DeepLink =
  | { type: "join"; roomCode: string; adminSecret?: string; templateId?: string }
  | { type: "member"; link: string };

function readLocationParams(search: string, hash: string): URLSearchParams {
  const merged = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (hash.startsWith("#")) {
    const fromHash = new URLSearchParams(hash.slice(1));
    for (const [key, value] of fromHash.entries()) {
      if (!merged.has(key)) merged.set(key, value);
    }
  }
  return merged;
}

export function parseJoinLocation(search: string, hash: string): DeepLink | null {
  const params = readLocationParams(search, hash);
  const roomCode = params.get("c") ?? params.get("code") ?? params.get("join");
  if (!roomCode) return null;

  return {
    type: "join",
    roomCode: decodeURIComponent(roomCode),
    adminSecret: params.get("admin") ?? undefined,
    templateId: params.get("template") ?? undefined,
  };
}

/** Read room code from /room location (hash-first, legacy query fallback). */
export function parseRoomCodeFromLocation(search: string, hash: string): string | null {
  const parsed = parseJoinLocation(search, hash);
  return parsed?.type === "join" ? parsed.roomCode : null;
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

  if (!s.includes(" ") && s.length >= 8) {
    return { type: "join", roomCode: s };
  }

  return null;
}

/** Strip invite params from the address bar (secrets must not linger in history). */
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
  if (url.hash) {
    const h = new URLSearchParams(url.hash.slice(1));
    let hashChanged = false;
    for (const key of ["c", "code", "join", "admin", "template"]) {
      if (h.has(key)) {
        h.delete(key);
        hashChanged = true;
      }
    }
    if (hashChanged) {
      const rest = h.toString();
      url.hash = rest ? rest : "";
      changed = true;
    }
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
  const d = parseJoinLocation(search, typeof window !== "undefined" ? window.location.hash : "");
  return d?.type === "join" ? d.roomCode : null;
}

export function parseAppSearchParams(search: string): { type: string; value: string } | null {
  const d = parseJoinLocation(search, typeof window !== "undefined" ? window.location.hash : "");
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
