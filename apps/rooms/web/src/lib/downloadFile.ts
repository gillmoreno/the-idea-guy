/**
 * downloadTextFile — trigger a client-side download of a text blob.
 *
 * No server round-trip: builds a Blob, points a temporary <a download> at an
 * object URL, clicks it, and revokes. Used by the Export brick (room data →
 * JSON/CSV) and reusable by anything that needs to hand the user a file.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "application/json",
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
