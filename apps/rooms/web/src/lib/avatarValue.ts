import {
  imageValueSrc,
  parseImageValue,
  type ImageValue,
} from "./imageValue";

/** Avatar brick — emoji or image (inline WebP / URL). Stored as JSON string. */
export type AvatarValue =
  | { kind: "emoji"; emoji: string }
  | { kind: "image"; image: ImageValue };

export function serializeAvatarValue(value: AvatarValue): string {
  return JSON.stringify(value);
}

export function parseAvatarValue(raw: string | undefined | null): AvatarValue | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t) as AvatarValue;
    if (o?.kind === "emoji" && typeof o.emoji === "string" && o.emoji.trim()) {
      return { kind: "emoji", emoji: [...o.emoji.trim()][0] ?? o.emoji.trim() };
    }
    if (o?.kind === "image") {
      const img =
        typeof o.image === "string"
          ? parseImageValue(o.image)
          : o.image?.kind === "inline" || o.image?.kind === "url"
            ? o.image
            : null;
      if (img) return { kind: "image", image: img };
    }
  } catch {
    return null;
  }
  return null;
}

export function isAvatarEmpty(raw: string | undefined | null): boolean {
  return !parseAvatarValue(raw);
}

/** QR-friendly: only include emoji avatars in contact cards (photos stay on inbox sync). */
export function avatarForContactCard(raw: string | undefined | null): string | undefined {
  const av = parseAvatarValue(raw);
  if (av?.kind === "emoji") return serializeAvatarValue(av);
  return undefined;
}

export type AvatarDisplay =
  | { mode: "emoji"; emoji: string }
  | { mode: "image"; src: string }
  | { mode: "initials"; initials: string; color: string };

export function resolveAvatarDisplay(
  raw: string | undefined | null,
  fallback: { displayName: string; color: string },
): AvatarDisplay {
  const av = parseAvatarValue(raw);
  if (av?.kind === "emoji") return { mode: "emoji", emoji: av.emoji };
  if (av?.kind === "image") {
    const src = imageValueSrc(av.image);
    if (src) return { mode: "image", src };
  }
  const initials = fallback.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return { mode: "initials", initials: initials || "?", color: fallback.color };
}
