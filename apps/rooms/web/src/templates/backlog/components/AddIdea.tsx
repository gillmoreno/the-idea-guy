"use client";

import { useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useBacklogStore } from "../lib/useBacklogStore";

export function AddIdea({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const store = useBacklogStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("💡");

  const canSave = !!store && title.trim() && description.trim();

  const save = () => {
    if (!store || !canSave) return;
    store.addIdea({ title, description, emoji, proposedById: memberId });
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">Propose an idea</div>
      <div className="grid-2">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Title</label>
          <input
            className="input"
            placeholder="Gift Circle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Emoji</label>
          <EmojiPicker value={emoji} onChange={setEmoji} fallback="💡" />
        </div>
      </div>
      <div className="field">
        <label>What would it do?</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Short pitch — who is it for, what problem does it solve?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Add to backlog
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
