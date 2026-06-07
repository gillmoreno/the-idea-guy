import { parseContactCard } from "@the-idea-guy/room-kit";

/** Normalize pasted text, QR payload, or URL into a contact card string. */
export function normalizeContactCardInput(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (parseContactCard(t)) return t;

  try {
    const url = new URL(t);
    for (const key of ["contact", "code", "c"]) {
      const v = url.searchParams.get(key)?.trim();
      if (v && parseContactCard(v)) return v;
    }
    const hash = url.hash.replace(/^#/, "").trim();
    if (hash && parseContactCard(hash)) return hash;
  } catch {
    /* not a URL */
  }

  const match = t.match(/rooms1\.[A-Za-z0-9_-]+/);
  if (match?.[0] && parseContactCard(match[0])) return match[0];

  return null;
}
