"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { ThemeToggle } from "./ThemeToggle";

const WELCOME_HTML = `
<h1>Welcome to Second Brain</h1>
<p>Your personal knowledge vault — write in rich HTML, link ideas, and search everything instantly.</p>
<div data-callout="true" data-variant="tip" class="callout callout-tip"><p><strong>Quick start</strong> — Create notes from the sidebar, type <code>[[</code> to link them, and use the toolbar for callouts and formatting.</p></div>
<div data-callout="true" data-variant="info" class="callout callout-info"><p><strong>Try these features</strong></p><ul><li>Search across your entire vault from the top bar</li><li>Open the graph view to see how notes connect</li><li>Ask AI questions grounded in your notes</li><li>Toggle dark mode in the top-right corner</li></ul></div>
<div data-callout="true" data-variant="success" class="callout callout-success"><p>Your data is local-first and end-to-end encrypted. Share your invite code in Settings to sync another device.</p></div>
`.trim();

export function Setup() {
  const { store, setActiveNoteId } = useSecondBrain();
  const [name, setName] = useState("My vault");

  const finish = () => {
    if (!store) return;
    store.initVault(name);
    const welcome = store.createNote({ title: "Welcome" });
    store.syncNoteContent(welcome.id, WELCOME_HTML);
    setActiveNoteId(welcome.id);
  };

  return (
    <div className="app">
      <div className="topbar">
        <h1>Set up your vault</h1>
        <ThemeToggle />
      </div>
      <div className="app-main">
        <div className="card stack">
          <div className="field">
            <label>Vault name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
            We&apos;ll create a welcome note with callouts and tips. Your invite code
            appears in Settings once setup finishes.
          </p>
          <button className="btn btn-primary btn-block" disabled={!store || !name.trim()} onClick={finish}>
            <Sparkles size={16} />
            Finish setup
          </button>
        </div>
      </div>
    </div>
  );
}
