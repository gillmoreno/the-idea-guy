/** Derive searchable plain text from HTML (strips tags/attributes). */
export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Extract internal note ids from HTML links with data-note-id. */
export function extractNoteLinks(html: string): string[] {
  if (typeof document === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ids = new Set<string>();
  for (const el of doc.querySelectorAll("a[data-note-id]")) {
    const id = el.getAttribute("data-note-id");
    if (id) ids.add(id);
  }
  return [...ids];
}

/** Yjs XmlFragment field name for a note's collaborative content. */
export function noteContentField(noteId: string): string {
  return `note-content-${noteId}`;
}
