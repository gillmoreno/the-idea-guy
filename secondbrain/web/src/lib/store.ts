import * as Y from "yjs";
import { imageBytesInHtml } from "./imageInsert";
import {
  AiSettings,
  DEFAULT_AI_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  Folder,
  LinkEntry,
  Note,
  VaultMeta,
} from "./types";
import { extractNoteLinks, htmlToPlainText, noteContentField } from "./html";
import { utf8ByteLength } from "./storageStats";

export const APP_ID = "secondbrain";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** NoteStore wraps a synced Yjs doc with the Second Brain domain model. */
export class NoteStore {
  readonly doc: Y.Doc;
  readonly vault: Y.Map<unknown>;
  readonly notes: Y.Map<Note>;
  readonly folders: Y.Map<Folder>;
  readonly linkIndex: Y.Map<LinkEntry>;
  readonly settings: Y.Map<unknown>;

  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.vault = doc.getMap("vault");
    this.notes = doc.getMap("notes");
    this.folders = doc.getMap("folders");
    this.linkIndex = doc.getMap("linkIndex");
    this.settings = doc.getMap("settings");
  }

  private tx(fn: () => void) {
    this.doc.transact(fn);
  }

  contentField(noteId: string): string {
    return noteContentField(noteId);
  }

  getContentFragment(noteId: string): Y.XmlFragment {
    return this.doc.getXmlFragment(this.contentField(noteId));
  }

  // --- vault ---
  isInitialized(): boolean {
    return this.vault.get("createdAt") != null;
  }

  getVault(): VaultMeta | null {
    if (!this.isInitialized()) return null;
    return {
      name: (this.vault.get("name") as string) ?? "My vault",
      createdAt: this.vault.get("createdAt") as number,
    };
  }

  initVault(name: string) {
    this.tx(() => {
      this.vault.set("name", name.trim() || "My vault");
      if (this.vault.get("createdAt") == null) {
        this.vault.set("createdAt", Date.now());
      }
    });
  }

  updateVaultName(name: string) {
    this.tx(() => this.vault.set("name", name.trim() || "My vault"));
  }

  // --- AI settings (per vault, E2E-synced) ---
  getAiSettings(): AiSettings {
    const raw = this.settings.get("ai") as Partial<AiSettings> | undefined;
    const provider = raw?.provider === "ollama" ? "ollama" : "openai";
    return {
      provider,
      apiKey: raw?.apiKey ?? "",
      baseUrl: raw?.baseUrl ?? DEFAULT_OLLAMA_BASE_URL,
      model:
        raw?.model ??
        (provider === "ollama" ? DEFAULT_OLLAMA_MODEL : DEFAULT_AI_MODEL),
    };
  }

  setAiSettings(patch: Partial<Pick<AiSettings, "provider" | "apiKey" | "baseUrl" | "model">>) {
    const current = this.getAiSettings();
    this.tx(() => {
      this.settings.set("ai", {
        provider: patch.provider ?? current.provider,
        apiKey: patch.apiKey ?? current.apiKey,
        baseUrl: patch.baseUrl ?? current.baseUrl,
        model: patch.model ?? current.model,
      });
    });
  }

  hasAiConfigured(): boolean {
    const s = this.getAiSettings();
    if (s.provider === "ollama") return s.baseUrl.trim().length > 0 && s.model.trim().length > 0;
    return s.apiKey.trim().length > 0;
  }

  // --- folders ---
  listFolders(): Folder[] {
    return [...this.folders.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  addFolder(name: string): Folder {
    const f: Folder = { id: uid("f_"), name: name.trim() || "Untitled", createdAt: Date.now() };
    this.tx(() => this.folders.set(f.id, f));
    return f;
  }

  deleteFolder(id: string) {
    this.tx(() => {
      this.folders.delete(id);
      for (const [nid, note] of this.notes.entries()) {
        if (note.folderId === id) {
          this.notes.set(nid, { ...note, folderId: undefined, updatedAt: Date.now() });
        }
      }
    });
  }

  // --- notes ---
  listNotes(opts?: { folderId?: string | null }): Note[] {
    let list = [...this.notes.values()];
    if (opts?.folderId !== undefined) {
      if (opts.folderId === null) {
        list = list.filter((n) => !n.folderId);
      } else {
        list = list.filter((n) => n.folderId === opts.folderId);
      }
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getNote(id: string): Note | undefined {
    return this.notes.get(id);
  }

  createNote(input?: { title?: string; folderId?: string }): Note {
    const id = uid("n_");
    const now = Date.now();
    const note: Note = {
      id,
      title: input?.title?.trim() || "Untitled",
      html: "<p></p>",
      plainText: "",
      folderId: input?.folderId,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    this.tx(() => {
      this.notes.set(id, note);
      this.linkIndex.set(id, { outgoing: [], incoming: [] });
      // Initialize empty Y.XmlFragment for collaborative editing
      const frag = this.getContentFragment(id);
      if (frag.length === 0) {
        const p = new Y.XmlElement("paragraph");
        frag.insert(0, [p]);
      }
    });
    return note;
  }

  updateNote(id: string, patch: Partial<Note>) {
    const existing = this.notes.get(id);
    if (!existing) return;
    this.tx(() =>
      this.notes.set(id, { ...existing, ...patch, updatedAt: Date.now() }),
    );
  }

  /** Sync html/plainText from editor and rebuild link index. */
  syncNoteContent(id: string, html: string): { freedImageBytes: number } {
    const existing = this.notes.get(id);
    if (!existing) return { freedImageBytes: 0 };
    const freedImageBytes = Math.max(
      0,
      imageBytesInHtml(existing.html) - imageBytesInHtml(html),
    );
    const plainText = htmlToPlainText(html);
    this.tx(() => {
      this.notes.set(id, {
        ...existing,
        html,
        plainText,
        updatedAt: Date.now(),
      });
    });
    this.rebuildLinkIndex(id, html);
    return { freedImageBytes };
  }

  deleteNote(id: string) {
    this.tx(() => {
      this.notes.delete(id);
      this.linkIndex.delete(id);
      // Clear fragment content
      const frag = this.getContentFragment(id);
      frag.delete(0, frag.length);
    });
    // Remove references from other notes' link index
    this.rebuildAllLinkIndices();
  }

  // --- link index ---
  getBacklinks(noteId: string): string[] {
    return this.linkIndex.get(noteId)?.incoming ?? [];
  }

  getOutgoingLinks(noteId: string): string[] {
    return this.linkIndex.get(noteId)?.outgoing ?? [];
  }

  private rebuildLinkIndex(noteId: string, html: string) {
    const outgoing = extractNoteLinks(html);
    this.tx(() => {
      const prev = this.linkIndex.get(noteId)?.outgoing ?? [];
      this.linkIndex.set(noteId, {
        outgoing,
        incoming: this.linkIndex.get(noteId)?.incoming ?? [],
      });
      // Update incoming on target notes
      for (const oldTarget of prev) {
        if (!outgoing.includes(oldTarget)) {
          this.removeIncoming(oldTarget, noteId);
        }
      }
      for (const target of outgoing) {
        this.addIncoming(target, noteId);
      }
    });
  }

  rebuildAllLinkIndices() {
    const allOutgoing = new Map<string, string[]>();
    for (const note of this.notes.values()) {
      allOutgoing.set(note.id, extractNoteLinks(note.html));
    }
    this.tx(() => {
      const incoming = new Map<string, Set<string>>();
      for (const [fromId, outs] of allOutgoing) {
        for (const toId of outs) {
          if (!incoming.has(toId)) incoming.set(toId, new Set());
          incoming.get(toId)!.add(fromId);
        }
        this.linkIndex.set(fromId, {
          outgoing: outs,
          incoming: [...(incoming.get(fromId) ?? [])],
        });
      }
      // Fix incoming for all notes
      for (const noteId of this.notes.keys()) {
        const entry = this.linkIndex.get(noteId) ?? { outgoing: [], incoming: [] };
        this.linkIndex.set(noteId, {
          outgoing: entry.outgoing,
          incoming: [...(incoming.get(noteId) ?? [])],
        });
      }
    });
  }

  private addIncoming(targetId: string, fromId: string) {
    const entry = this.linkIndex.get(targetId) ?? { outgoing: [], incoming: [] };
    if (!entry.incoming.includes(fromId)) {
      this.linkIndex.set(targetId, {
        ...entry,
        incoming: [...entry.incoming, fromId],
      });
    }
  }

  private removeIncoming(targetId: string, fromId: string) {
    const entry = this.linkIndex.get(targetId);
    if (!entry) return;
    this.linkIndex.set(targetId, {
      ...entry,
      incoming: entry.incoming.filter((id) => id !== fromId),
    });
  }

  /** Byte estimates for link-index entries (for storage stats). */
  getLinkIndexStats(): { id: string; bytes: number }[] {
    const stats: { id: string; bytes: number }[] = [];
    for (const [id, entry] of this.linkIndex.entries()) {
      stats.push({ id, bytes: utf8ByteLength(JSON.stringify(entry)) });
    }
    return stats;
  }

  /** All link pairs for graph visualization. */
  getGraphEdges(): { source: string; target: string }[] {
    const edges: { source: string; target: string }[] = [];
    for (const [fromId, entry] of this.linkIndex.entries()) {
      for (const toId of entry.outgoing) {
        edges.push({ source: fromId, target: toId });
      }
    }
    return edges;
  }
}
