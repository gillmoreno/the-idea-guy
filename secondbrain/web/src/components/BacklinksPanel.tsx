"use client";

import { NoteStore } from "@/lib/store";

interface BacklinksPanelProps {
  noteId: string;
  store: NoteStore;
  onNavigate: (id: string) => void;
}

export function BacklinksPanel({ noteId, store, onNavigate }: BacklinksPanelProps) {
  const backlinks = store.getBacklinks(noteId);
  const outgoing = store.getOutgoingLinks(noteId);

  if (backlinks.length === 0 && outgoing.length === 0) {
    return (
      <div className="panel-section">
        <div className="panel-title">Links</div>
        <p className="muted" style={{ fontSize: 13 }}>No links yet. Type [[ in the editor to link notes.</p>
      </div>
    );
  }

  return (
    <div className="panel-section stack-sm">
      {outgoing.length > 0 && (
        <div>
          <div className="panel-title">Outgoing</div>
          <div className="link-list">
            {outgoing.map((id) => {
              const n = store.getNote(id);
              return (
                <button key={id} className="link-chip" onClick={() => onNavigate(id)}>
                  {n?.title ?? "Missing note"}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {backlinks.length > 0 && (
        <div>
          <div className="panel-title">Backlinks</div>
          <div className="link-list">
            {backlinks.map((id) => {
              const n = store.getNote(id);
              return (
                <button key={id} className="link-chip" onClick={() => onNavigate(id)}>
                  {n?.title ?? "Missing note"}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
