/** Serialized image field value — stored in Yjs / schema record fields. */
export type ImageValue =
  | { kind: "inline"; mime: "image/webp"; data: string }
  | { kind: "url"; url: string };

export const MAX_INLINE_IMAGE_BYTES = 300 * 1024;

export function serializeImageValue(value: ImageValue): string {
  return JSON.stringify(value);
}

export function parseImageValue(raw: string): ImageValue | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const parsed = JSON.parse(t) as ImageValue;
    if (parsed?.kind === "inline" && parsed.mime === "image/webp" && typeof parsed.data === "string") {
      return parsed;
    }
    if (parsed?.kind === "url" && typeof parsed.url === "string") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function imageValueSrc(value: ImageValue | null): string | null {
  if (!value) return null;
  if (value.kind === "url") return value.url;
  return `data:${value.mime};base64,${value.data}`;
}

export function isImageFieldEmpty(raw: string): boolean {
  return !parseImageValue(raw);
}

export function inlineImageByteLength(data: string): number {
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

export function parseHttpImageUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}
