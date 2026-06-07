import * as Y from "yjs";
import { imageBytesInHtml } from "./imageInsert";
import { NoteStore } from "./store";
import { Note } from "./types";

/** UTF-8 byte length of a string (what actually occupies local storage). */
export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Estimated bytes for one note's title, HTML, plain text, and metadata. */
export function noteStorageBytes(note: Note): number {
  const meta = utf8ByteLength(
    JSON.stringify({
      id: note.id,
      tags: note.tags,
      folderId: note.folderId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }),
  );
  return (
    utf8ByteLength(note.title) +
    utf8ByteLength(note.html) +
    utf8ByteLength(note.plainText) +
    meta
  );
}

export interface NoteStorageStat {
  id: string;
  title: string;
  bytes: number;
  imageBytes: number;
}

export interface VaultStorageStats {
  noteCount: number;
  contentBytes: number;
  imageBytes: number;
  crdtBytes: number;
  notes: NoteStorageStat[];
}

export function computeVaultStorage(store: NoteStore): VaultStorageStats {
  const notes = store.listNotes();
  const noteStats: NoteStorageStat[] = notes.map((n) => ({
    id: n.id,
    title: n.title || "Untitled",
    bytes: noteStorageBytes(n),
    imageBytes: imageBytesInHtml(n.html),
  }));

  let overhead = 0;
  const vault = store.getVault();
  if (vault) overhead += utf8ByteLength(JSON.stringify(vault));
  overhead += utf8ByteLength(JSON.stringify(store.listFolders()));
  for (const stat of store.getLinkIndexStats()) {
    overhead += stat.bytes;
  }

  const contentBytes =
    noteStats.reduce((sum, n) => sum + n.bytes, 0) + overhead;
  const crdtBytes = Y.encodeStateAsUpdate(store.doc).byteLength;

  const imageBytes = noteStats.reduce((sum, n) => sum + n.imageBytes, 0);

  return {
    noteCount: notes.length,
    contentBytes,
    imageBytes,
    crdtBytes,
    notes: [...noteStats].sort((a, b) => b.bytes - a.bytes),
  };
}

export interface OriginStorageEstimate {
  used: number;
  quota: number;
}

/** Browser-reported storage for this origin (IndexedDB + caches, etc.). */
export async function getOriginStorageEstimate(): Promise<OriginStorageEstimate | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }
  const est = await navigator.storage.estimate();
  if (est.usage == null) return null;
  return {
    used: est.usage,
    quota: est.quota ?? 0,
  };
}
