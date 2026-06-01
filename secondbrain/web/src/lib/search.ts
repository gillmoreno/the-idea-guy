import MiniSearch from "minisearch";
import { Note, SearchResult } from "./types";

export class NoteSearchIndex {
  private mini: MiniSearch<{ id: string; title: string; plainText: string; tags: string }>;
  private noteIds = new Set<string>();

  constructor() {
    this.mini = new MiniSearch({
      fields: ["title", "plainText", "tags"],
      storeFields: ["title", "plainText"],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  rebuild(notes: Note[]) {
    this.mini.removeAll();
    this.noteIds.clear();
    const docs = notes.map((n) => ({
      id: n.id,
      title: n.title,
      plainText: n.plainText,
      tags: n.tags.join(" "),
    }));
    if (docs.length) this.mini.addAll(docs);
    for (const n of notes) this.noteIds.add(n.id);
  }

  search(query: string, limit = 10): SearchResult[] {
    const q = query.trim();
    if (!q) return [];
    const hits = this.mini.search(q).slice(0, limit);
    return hits.map((h) => ({
      id: h.id,
      title: (h.title as string) ?? "Untitled",
      snippet: snippetFrom((h.plainText as string) ?? "", q),
      score: h.score,
    }));
  }

  /** Top N notes by keyword match for AI context retrieval. */
  retrieveForAI(query: string, limit = 5): { id: string; title: string; plainText: string }[] {
    return this.search(query, limit).map((r) => {
      const stored = this.mini.getStoredFields(r.id) as { title?: string; plainText?: string };
      return {
        id: r.id,
        title: stored?.title ?? r.title,
        plainText: (stored?.plainText ?? r.snippet).slice(0, 2000),
      };
    });
  }
}

function snippetFrom(text: string, query: string, radius = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0) return text.slice(0, radius * 2) + (text.length > radius * 2 ? "…" : "");
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
