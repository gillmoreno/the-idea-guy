import { NoteSearchIndex } from "./search";
import { NoteStore } from "./store";
import { AICitation, Note } from "./types";

export interface VaultToolContext {
  store: NoteStore;
  searchIndex: NoteSearchIndex;
}

type DateField = "updatedAt" | "createdAt";

const MAX_SNIPPET = 500;
const MAX_NOTE_BODY = 4000;
const MAX_LIST = 50;

export const VAULT_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "count_notes",
      description:
        "Count notes in the vault. Use for questions like 'how many notes/posts do I have?'. " +
        "Optional filters: folder, tag, or date range.",
      parameters: {
        type: "object",
        properties: {
          folder_name: { type: "string", description: "Filter by folder name (case-insensitive)" },
          tag: { type: "string", description: "Filter by tag (case-insensitive)" },
          since_ms: { type: "number", description: "Only notes updated/created on or after this Unix ms" },
          until_ms: { type: "number", description: "Only notes updated/created on or before this Unix ms" },
          date_field: {
            type: "string",
            enum: ["updatedAt", "createdAt"],
            description: "Which timestamp to use for date filters (default updatedAt)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_notes",
      description:
        "List note titles and dates, optionally filtered. Use to browse notes by folder, tag, or time period.",
      parameters: {
        type: "object",
        properties: {
          folder_name: { type: "string" },
          tag: { type: "string" },
          since_ms: { type: "number" },
          until_ms: { type: "number" },
          date_field: { type: "string", enum: ["updatedAt", "createdAt"] },
          limit: { type: "number", description: "Max results (default 20, max 50)" },
          order: { type: "string", enum: ["newest", "oldest"], description: "Sort order (default newest)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_notes",
      description:
        "Search note content by keywords (MiniSearch, no embeddings). " +
        "Use for finding ideas or topics — combine with since_ms/until_ms for 'about two weeks ago' style queries. " +
        "Pass a focused query (e.g. 'pizza idea') not the full user sentence.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search terms — keywords from the topic, not filler words",
          },
          since_ms: { type: "number", description: "Only notes in this date range" },
          until_ms: { type: "number" },
          date_field: { type: "string", enum: ["updatedAt", "createdAt"] },
          limit: { type: "number", description: "Max results (default 8)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_note",
      description: "Read full content of one note by id or title (case-insensitive title match).",
      parameters: {
        type: "object",
        properties: {
          note_id: { type: "string", description: "Note id from a prior tool result" },
          title: { type: "string", description: "Note title if id unknown" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_folders",
      description: "List all folders with note counts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tags",
      description: "List all tags used in the vault with note counts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_links",
      description: "Get backlinks (incoming) or outgoing wiki-links for a note.",
      parameters: {
        type: "object",
        properties: {
          note_id: { type: "string" },
          title: { type: "string" },
          direction: {
            type: "string",
            enum: ["incoming", "outgoing", "both"],
            description: "Default both",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "vault_summary",
      description: "High-level vault stats: note count, folders, tags, date range, storage hint.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function clampLimit(n: unknown, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.min(MAX_LIST, Math.max(1, v));
}

function dateField(raw: unknown): DateField {
  return raw === "createdAt" ? "createdAt" : "updatedAt";
}

function noteTimestamp(note: Note, field: DateField): number {
  return field === "createdAt" ? note.createdAt : note.updatedAt;
}

function filterByDate(
  notes: Note[],
  sinceMs?: number,
  untilMs?: number,
  field: DateField = "updatedAt",
): Note[] {
  return notes.filter((n) => {
    const t = noteTimestamp(n, field);
    if (sinceMs != null && t < sinceMs) return false;
    if (untilMs != null && t > untilMs) return false;
    return true;
  });
}

function resolveFolderId(store: NoteStore, folderName?: string): string | undefined | null {
  if (!folderName?.trim()) return undefined;
  const lower = folderName.trim().toLowerCase();
  const match = store.listFolders().find((f) => f.name.toLowerCase() === lower);
  return match?.id ?? null;
}

function applyNoteFilters(
  store: NoteStore,
  args: {
    folder_name?: string;
    tag?: string;
    since_ms?: number;
    until_ms?: number;
    date_field?: unknown;
  },
): Note[] {
  const field = dateField(args.date_field);
  let folderId: string | undefined;
  if (args.folder_name?.trim()) {
    const resolved = resolveFolderId(store, args.folder_name);
    if (resolved === null) return [];
    folderId = resolved;
  }

  let notes = store.listNotes(folderId !== undefined ? { folderId } : undefined);

  if (args.tag?.trim()) {
    const tagLower = args.tag.trim().toLowerCase();
    notes = notes.filter((n) => n.tags.some((t) => t.toLowerCase() === tagLower));
  }

  return filterByDate(notes, args.since_ms, args.until_ms, field);
}

function resolveNote(
  store: NoteStore,
  noteId?: string,
  title?: string,
): Note | undefined {
  if (noteId?.trim()) {
    const byId = store.getNote(noteId.trim());
    if (byId) return byId;
  }
  if (title?.trim()) {
    const lower = title.trim().toLowerCase();
    const exact = store.listNotes().find((n) => n.title.toLowerCase() === lower);
    if (exact) return exact;
    const partial = store.listNotes().find((n) => n.title.toLowerCase().includes(lower));
    if (partial) return partial;
  }
  return undefined;
}

function livePlainText(ctx: VaultToolContext, noteId: string, fallback: string): string {
  return ctx.store.getLivePlainText(noteId) || fallback;
}

function formatNoteListItem(
  ctx: VaultToolContext,
  note: Note,
  field: DateField,
  snippet?: string,
) {
  const text = livePlainText(ctx, note.id, note.plainText);
  return {
    id: note.id,
    title: note.title,
    tags: note.tags,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
    dateUsed: noteTimestamp(note, field),
    snippet: snippet ?? truncate(text, MAX_SNIPPET),
  };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function noteTitle(store: NoteStore, id: string): string {
  return store.getNote(id)?.title ?? id;
}

function cite(note: Note): AICitation {
  return { id: note.id, title: note.title };
}

function citeId(store: NoteStore, id: string): AICitation {
  const note = store.getNote(id);
  return note ? cite(note) : { id, title: noteTitle(store, id) };
}

export function humanToolLabel(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "count_notes":
      return "Counting notes…";
    case "list_notes":
      return "Listing notes…";
    case "search_notes":
      return `Searching for "${String(args.query ?? "")}"…`;
    case "get_note":
      return `Reading "${String(args.title ?? args.note_id ?? "note")}"…`;
    case "list_folders":
      return "Listing folders…";
    case "list_tags":
      return "Listing tags…";
    case "get_links":
      return "Checking links…";
    case "vault_summary":
      return "Summarizing vault…";
    default:
      return `Running ${name}…`;
  }
}

export function executeVaultTool(
  name: string,
  args: Record<string, unknown>,
  ctx: VaultToolContext,
): { result: unknown; citedNotes: AICitation[] } {
  const citedNotes: AICitation[] = [];

  switch (name) {
    case "count_notes": {
      const notes = applyNoteFilters(ctx.store, args);
      for (const n of notes) citedNotes.push(cite(n));
      return {
        result: {
          count: notes.length,
          titles: notes.map((n) => n.title),
        },
        citedNotes,
      };
    }

    case "list_notes": {
      const field = dateField(args.date_field);
      let notes = applyNoteFilters(ctx.store, args);
      const order = args.order === "oldest" ? "oldest" : "newest";
      notes.sort((a, b) =>
        order === "oldest"
          ? noteTimestamp(a, field) - noteTimestamp(b, field)
          : noteTimestamp(b, field) - noteTimestamp(a, field),
      );
      const limit = clampLimit(args.limit, 20);
      const slice = notes.slice(0, limit);
      for (const n of slice) citedNotes.push(cite(n));
      return {
        result: {
          count: notes.length,
          returned: slice.length,
          notes: slice.map((n) => formatNoteListItem(ctx, n, field)),
        },
        citedNotes,
      };
    }

    case "search_notes": {
      const query = String(args.query ?? "").trim();
      if (!query) {
        return { result: { error: "query is required" }, citedNotes };
      }
      const field = dateField(args.date_field);
      const limit = clampLimit(args.limit, 8);
      const sinceMs = typeof args.since_ms === "number" ? args.since_ms : undefined;
      const untilMs = typeof args.until_ms === "number" ? args.until_ms : undefined;

      const hits = ctx.searchIndex.search(query, limit * 4);
      const results: ReturnType<typeof formatNoteListItem>[] = [];

      for (const hit of hits) {
        const note = ctx.store.getNote(hit.id);
        if (!note) continue;
        const t = noteTimestamp(note, field);
        if (sinceMs != null && t < sinceMs) continue;
        if (untilMs != null && t > untilMs) continue;
        citedNotes.push(cite(note));
        results.push(formatNoteListItem(ctx, note, field, hit.snippet));
        if (results.length >= limit) break;
      }

      if (results.length === 0 && (sinceMs != null || untilMs != null)) {
        const inRange = filterByDate(ctx.store.listNotes(), sinceMs, untilMs, field)
          .sort((a, b) => noteTimestamp(b, field) - noteTimestamp(a, field))
          .slice(0, limit);
        for (const note of inRange) {
          citedNotes.push(cite(note));
          results.push(formatNoteListItem(ctx, note, field));
        }
        return {
          result: {
            query,
            matchCount: 0,
            dateRangeFallback: true,
            notes: results,
            hint: "No keyword hits in date range; returned notes from that period instead.",
          },
          citedNotes,
        };
      }

      return {
        result: { query, matchCount: results.length, notes: results },
        citedNotes,
      };
    }

    case "get_note": {
      const note = resolveNote(
        ctx.store,
        args.note_id as string | undefined,
        args.title as string | undefined,
      );
      if (!note) {
        return { result: { error: "Note not found" }, citedNotes };
      }
      citedNotes.push(cite(note));
      return {
        result: {
          id: note.id,
          title: note.title,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          plainText: truncate(livePlainText(ctx, note.id, note.plainText), MAX_NOTE_BODY),
        },
        citedNotes,
      };
    }

    case "list_folders": {
      const folders = ctx.store.listFolders().map((f) => ({
        id: f.id,
        name: f.name,
        noteCount: ctx.store.listNotes({ folderId: f.id }).length,
      }));
      const unfiled = ctx.store.listNotes({ folderId: null }).length;
      return { result: { folders, unfiledNoteCount: unfiled }, citedNotes };
    }

    case "list_tags": {
      const counts = new Map<string, number>();
      for (const note of ctx.store.listNotes()) {
        for (const tag of note.tags) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      const tags = [...counts.entries()]
        .map(([tag, noteCount]) => ({ tag, noteCount }))
        .sort((a, b) => b.noteCount - a.noteCount || a.tag.localeCompare(b.tag));
      return { result: { tags }, citedNotes };
    }

    case "get_links": {
      const note = resolveNote(
        ctx.store,
        args.note_id as string | undefined,
        args.title as string | undefined,
      );
      if (!note) {
        return { result: { error: "Note not found" }, citedNotes };
      }
      citedNotes.push(cite(note));
      const direction = (args.direction as string) ?? "both";
      const outgoing = ctx.store.getOutgoingLinks(note.id).map((id) => ({
        id,
        title: noteTitle(ctx.store, id),
      }));
      const incoming = ctx.store.getBacklinks(note.id).map((id) => ({
        id,
        title: noteTitle(ctx.store, id),
      }));
      for (const link of [...outgoing, ...incoming]) {
        citedNotes.push(citeId(ctx.store, link.id));
      }
      return {
        result: {
          note: note.title,
          outgoing: direction === "incoming" ? [] : outgoing,
          incoming: direction === "outgoing" ? [] : incoming,
        },
        citedNotes,
      };
    }

    case "vault_summary": {
      const notes = ctx.store.listNotes();
      for (const n of notes.slice(0, 5)) citedNotes.push(cite(n));
      const tags = new Set<string>();
      for (const n of notes) for (const t of n.tags) tags.add(t);
      const updated = notes.map((n) => n.updatedAt);
      return {
        result: {
          noteCount: notes.length,
          folderCount: ctx.store.listFolders().length,
          tagCount: tags.size,
          oldestUpdatedAt: updated.length ? Math.min(...updated) : null,
          newestUpdatedAt: updated.length ? Math.max(...updated) : null,
          vaultName: ctx.store.getVault()?.name ?? "My vault",
        },
        citedNotes,
      };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` }, citedNotes };
  }
}
