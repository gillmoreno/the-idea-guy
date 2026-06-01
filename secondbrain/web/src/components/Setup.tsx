"use client";

import { useState } from "react";
import { useSecondBrain } from "@/lib/SecondBrainContext";

export function Setup() {
  const { store, setActiveNoteId } = useSecondBrain();
  const [name, setName] = useState("My vault");

  const finish = () => {
    if (!store) return;
    store.initVault(name);
    const welcome = store.createNote({ title: "Welcome" });
    store.syncNoteContent(
      welcome.id,
      `<h1>Welcome to Second Brain</h1><p>This is your first note. Try:</p><ul><li>Creating notes from the sidebar</li><li>Linking with <code>[[</code> to open the link picker</li><li>Searching across your vault</li><li>Asking AI questions about your notes</li></ul>`,
    );
    setActiveNoteId(welcome.id);
  };

  return (
    <div className="app">
      <div className="topbar">
        <h1>Set up your vault</h1>
      </div>
      <div className="app-main">
        <div className="card stack">
          <div className="field">
            <label>Vault name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            We&apos;ll create a welcome note to get you started. Your invite code is in
            Settings once setup finishes.
          </p>
          <button className="btn btn-primary btn-block" disabled={!store || !name.trim()} onClick={finish}>
            Finish setup
          </button>
        </div>
      </div>
    </div>
  );
}
