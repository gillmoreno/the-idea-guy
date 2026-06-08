"use client";

import { useMemo, useState } from "react";
import { CodeXml, FileText, Plus, Search } from "lucide-react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { Note } from "@/lib/types";
import { formatBytes, noteStorageBytes } from "@/lib/storageStats";

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onNewHtmlPage?: () => void;
  onDelete: (id: string) => void;
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Sidebar({
  notes,
  activeNoteId,
  onSelect,
  onNew,
  onNewHtmlPage,
  onDelete,
}: SidebarProps) {
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
          (store?.getLivePlainText(n.id) || n.plainText).toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, folderFilter, query, store]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-new-row">
          <button className="btn btn-primary btn-sm btn-block" onClick={onNew}>
            <Plus size={15} />
            New note
          </button>
          {onNewHtmlPage && (
            <button
              className="btn btn-sm btn-block sidebar-html-btn"
              onClick={onNewHtmlPage}
              title="New AI-designed HTML page"
            >
              <CodeXml size={15} />
              HTML page
            </button>
          )}
        </div>
        <div className="search-icon-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="input sidebar-search"
            placeholder="Filter notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {folders.length > 0 && (
        <div className="folder-tabs">
          <button
            className={`pill-btn ${folderFilter === "all" ? "active" : ""}`}
            onClick={() => setFolderFilter("all")}
          >
            All
          </button>
          <button
            className={`pill-btn ${folderFilter === "none" ? "active" : ""}`}
            onClick={() => setFolderFilter("none")}
          >
            Inbox
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              className={`pill-btn ${folderFilter === f.id ? "active" : ""}`}
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
              <div className="note-item-title">
                {n.title || "Untitled"}
                {n.contentType === "htmlPage" && (
                  <span className="note-type-badge">HTML</span>
                )}
              </div>
              <div className="note-item-preview">
                {(store?.getLivePlainText(n.id) || n.plainText).slice(0, 72) || "Empty note"}
              </div>
              <div className="note-item-meta">
                <FileText size={10} />
                {relativeTime(n.updatedAt)}
                <span>·</span>
                <span>{formatBytes(noteStorageBytes(n))}</span>
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
