import type { Editor } from "@tiptap/react";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export function isImageFile(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type) || file.type.startsWith("image/");
}

export async function readImageDataUrl(file: File): Promise<string | null> {
  if (!isImageFile(file)) return null;
  if (file.size > MAX_IMAGE_BYTES) {
    window.alert(
      `Images must be under ${formatFileSize(MAX_IMAGE_BYTES)}. This file is ${formatFileSize(file.size)}.`,
    );
    return null;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function insertImageSrc(editor: Editor, src: string, alt = ""): void {
  editor.chain().focus().setImage({ src, alt: alt || "Image" }).run();
}

export async function insertImageFile(editor: Editor, file: File): Promise<boolean> {
  const dataUrl = await readImageDataUrl(file);
  if (!dataUrl) return false;
  insertImageSrc(editor, dataUrl, file.name.replace(/\.[^.]+$/, ""));
  return true;
}

export function promptImageUrl(editor: Editor): void {
  const url = window.prompt("Image URL (https://…)");
  if (!url?.trim()) return;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      window.alert("Only http and https image URLs are supported.");
      return;
    }
    insertImageSrc(editor, parsed.href);
  } catch {
    window.alert("That doesn't look like a valid URL.");
  }
}

/** Sum UTF-8 bytes of inline image data URLs / src attributes in note HTML. */
export function imageBytesInHtml(html: string): number {
  if (typeof document === "undefined") {
    const matches = html.match(/src="(data:image[^"]+)"/g) ?? [];
    return matches.reduce((sum, m) => sum + new TextEncoder().encode(m).length, 0);
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  let bytes = 0;
  for (const img of doc.querySelectorAll("img[src]")) {
    bytes += new TextEncoder().encode(img.getAttribute("src") ?? "").length;
  }
  return bytes;
}
