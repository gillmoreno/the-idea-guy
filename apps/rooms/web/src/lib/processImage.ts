import { MAX_INLINE_IMAGE_BYTES } from "./imageValue";

const MAX_EDGE_PX = 1280;
export const MAX_AVATAR_EDGE_PX = 256;
export const MAX_AVATAR_BYTES = 80 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

/** Center-crop to square, then scale down. */
export function drawSquareCrop(
  img: HTMLImageElement,
  maxEdge: number,
): { canvas: HTMLCanvasElement; size: number } {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.floor((img.naturalWidth - side) / 2);
  const sy = Math.floor((img.naturalHeight - side) / 2);
  const edge = Math.min(maxEdge, side);
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, edge, edge);
  return { canvas, size: edge };
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Read failed"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function compressSquareToWebpBase64(
  file: File,
  maxEdge: number,
  maxBytes: number,
  minEdge: number,
  label: string,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file");
  }

  const img = await loadImage(file);
  let edge = maxEdge;
  let { canvas } = drawSquareCrop(img, edge);

  for (let attempt = 0; attempt < 8; attempt++) {
    for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38]) {
      const blob = await canvasToWebpBlob(canvas, quality);
      if (!blob) continue;
      if (blob.size <= maxBytes) {
        return blobToBase64(blob);
      }
    }
    edge = Math.floor(edge * 0.82);
    if (edge < minEdge) break;
    ({ canvas } = drawSquareCrop(img, edge));
  }

  throw new Error(`Could not compress ${label} — try a smaller photo`);
}

/**
 * Auto-crop (center square), resize, and compress to WebP ≤ 300 KB.
 * Returns base64 payload without the data-URL prefix.
 */
export async function processImageUpload(file: File): Promise<string> {
  return compressSquareToWebpBase64(
    file,
    MAX_EDGE_PX,
    MAX_INLINE_IMAGE_BYTES,
    320,
    "image",
  );
}

/**
 * Square avatar — smaller edge cap and tighter byte budget for persona / profile tiles.
 */
export async function processAvatarUpload(file: File): Promise<string> {
  return compressSquareToWebpBase64(
    file,
    MAX_AVATAR_EDGE_PX,
    MAX_AVATAR_BYTES,
    96,
    "avatar",
  );
}
