"use client";

import { useState } from "react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { Sidebar } from "./Sidebar";
import { NoteEditor } from "./NoteEditor";
import { BacklinksPanel } from "./BacklinksPanel";
import { SearchBar } from "./SearchBar";
import { AIPanel } from "./AIPanel";
import { GraphView } from "./GraphView";
import { SyncBadge } from "./ui";

export function VaultApp() {
  const {
    store,
    sync,
    version,
    inviteCode,
    activeNoteId,
    setActiveNoteId,
    leave,
  } = useSecondBrain();

  const [showAI, setShowAI] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!store) return null;

  // version triggers re-render on doc changes
  void version;
  const notes = store.listNotes();
  const vault = store.getVault();

  const handleNew = () => {
    const note = store.createNote();
    setActiveNoteId(note.id);
  };

  const handleDelete = (id: string) => {
    store.deleteNote(id);
    if (activeNoteId === id) {
      const remaining = store.listNotes();
      setActiveNoteId(remaining[0]?.id ?? null);
    }
  };

  const handleNavigate = (id: string) => {
    setActiveNoteId(id);
    setShowGraph(false);
  };

  return (
    <div className="vault-app">
      <header className="vault-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen((o) => !o)}>
          ☰
        </button>
        <div className="vault-title">
          <span>{vault?.name ?? "Vault"}</span>
          <SyncBadge {...sync} />
        </div>
        <SearchBar onSelect={handleNavigate} />
        <div className="topbar-actions">
          <button className="btn btn-sm" onClick={() => setShowGraph((g) => !g)}>
            Graph
          </button>
          <button className="btn btn-sm" onClick={() => setShowAI((a) => !a)}>
            AI
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>
            ⚙
          </button>
        </div>
      </header>

      <div className="vault-body">
        {sidebarOpen && (
          <Sidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelect={setActiveNoteId}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        )}

        <main className="vault-main">
          {showGraph ? (
            <GraphView
              store={store}
              activeNoteId={activeNoteId}
              onSelect={handleNavigate}
              onClose={() => setShowGraph(false)}
            />
          ) : activeNoteId && store.getNote(activeNoteId) ? (
            <>
              <NoteEditor
                noteId={activeNoteId}
                store={store}
                onNavigate={handleNavigate}
              />
              <aside className="right-panel">
                <BacklinksPanel
                  noteId={activeNoteId}
                  store={store}
                  onNavigate={handleNavigate}
                />
              </aside>
            </>
          ) : (
            <div className="empty" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div>
                <div style={{ fontSize: 40, textAlign: "center" }}>📝</div>
                <p style={{ marginTop: 12, fontWeight: 600 }}>Select or create a note</p>
                <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  {notes.length === 0
                    ? "Your vault is empty — create your first note."
                    : `${notes.length} note${notes.length === 1 ? "" : "s"} in your vault`}
                </p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleNew}>
                  + New note
                </button>
              </div>
            </div>
          )}
        </main>

        {showAI && (
          <AIPanel activeNoteId={activeNoteId} onClose={() => setShowAI(false)} />
        )}
      </div>

      {showSettings && (
        <SettingsModal
          inviteCode={inviteCode}
          vaultName={vault?.name ?? ""}
          onRename={(name) => store.updateVaultName(name)}
          onLeave={leave}
          onClose={() => setShowSettings(false)}
          onAddFolder={(name) => store.addFolder(name)}
          folders={store.listFolders()}
        />
      )}
    </div>
  );
}

function SettingsModal({
  inviteCode,
  vaultName,
  onRename,
  onLeave,
  onClose,
  onAddFolder,
  folders,
}: {
  inviteCode: string | null;
  vaultName: string;
  onRename: (name: string) => void;
  onLeave: () => void;
  onClose: () => void;
  onAddFolder: (name: string) => void;
  folders: { id: string; name: string }[];
}) {
  const [name, setName] = useState(vaultName);
  const [folderName, setFolderName] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card stack" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="field">
          <label>Vault name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => onRename(name)}>
            Save name
          </button>
        </div>
        <div className="field">
          <label>Invite code (share to sync devices)</label>
          <div className="code-box">{inviteCode}</div>
        </div>
        <div className="field">
          <label>Folders</label>
          {folders.map((f) => (
            <div key={f.id} className="muted" style={{ fontSize: 13 }}>
              {f.name}
            </div>
          ))}
          <div className="btn-row" style={{ marginTop: 8 }}>
            <input
              className="input"
              placeholder="New folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
            <button
              className="btn btn-sm"
              onClick={() => {
                if (folderName.trim()) {
                  onAddFolder(folderName.trim());
                  setFolderName("");
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
        <button className="btn btn-danger btn-block" onClick={onLeave}>
          Leave vault
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
