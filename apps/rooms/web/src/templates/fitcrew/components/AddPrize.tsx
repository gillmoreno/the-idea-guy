"use client";

import { useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useFitCrewStore } from "../lib/useFitCrewStore";

export function AddPrize({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const store = useFitCrewStore();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🏆");
  const [description, setDescription] = useState("");

  const canSave = !!store && title.trim();

  const save = () => {
    if (!store || !canSave) return;
    store.addPrize({
      title,
      emoji,
      description,
      createdById: memberId,
    });
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">Add a prize</div>
      <p className="muted" style={{ fontSize: 13 }}>
        Stupid stakes make streaks stick — loser buys coffee, winner picks movie night…
      </p>
      <div className="field">
        <label>Prize *</label>
        <input
          className="input"
          placeholder="Loser buys brunch"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Emoji</label>
        <EmojiPicker value={emoji} onChange={setEmoji} fallback="🏆" />
      </div>
      <div className="field">
        <label>Details (optional)</label>
        <textarea
          className="input"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" type="button" disabled={!canSave} onClick={save}>
          Add prize
        </button>
        <button className="btn" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
