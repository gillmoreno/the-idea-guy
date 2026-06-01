"use client";

import { useMemo, useState } from "react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { Note } from "@/lib/types";

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({ notes, activeNoteId, onSelect, onNew, onDelete }: SidebarProps) {
  const { store } = useSecondBrain();
  const [folderFilter, setFolderFilter] = useState<string | "all" | "none">("all");
  const [query, setQuery] = useState("");

  const folders = store?.listFolders() ?? [];

  const filtered = useMemo(() => {
    let list = notes;
    if (folderFilter === "none") list = list.filter((n) => !n.folderId);
    else if (folderFilter !== "all") list = list.filter((n) => n.folderId === folderFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.plainText.toLowerCase().includes(q),
      );
    }
    return list;
  }, [notes, folderFilter, query]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="btn btn-primary btn-sm btn-block" onClick={onNew}>
          + New note
        </button>
        <input
          className="input sidebar-search"
          placeholder="Filter notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {folders.length > 0 && (
        <div className="folder-tabs">
          <button
            className={folderFilter === "all" ? "active" : ""}
            onClick={() => setFolderFilter("all")}
          >
            All
          </button>
          <button
            className={folderFilter === "none" ? "active" : ""}
            onClick={() => setFolderFilter("none")}
          >
            Inbox
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              className={folderFilter === f.id ? "active" : ""}
              onClick={() => setFolderFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <div className="note-list">
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: 16, fontSize: 13 }}>
            {notes.length === 0 ? "No notes yet" : "No matches"}
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`note-item ${n.id === activeNoteId ? "active" : ""}`}
              onClick={() => onSelect(n.id)}
            >
              <div className="note-item-title">{n.title || "Untitled"}</div>
              <div className="note-item-preview">
                {n.plainText.slice(0, 60) || "Empty note"}
              </div>
              <button
                className="note-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this note?")) onDelete(n.id);
                }}
                aria-label="Delete note"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
