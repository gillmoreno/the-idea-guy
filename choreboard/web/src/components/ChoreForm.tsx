"use client";

import { useState } from "react";
import {
  CATEGORY_META,
  Category,
  Chore,
  DIFFICULTY_META,
  Difficulty,
  Recurrence,
} from "@/lib/types";

export interface ChoreDraft {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number;
  recurrence: Recurrence;
  requiresApproval: boolean;
}

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  anytime: "Anytime",
  daily: "Daily",
  weekly: "Weekly",
  "one-off": "One-off",
};

export function ChoreForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Chore>;
  submitLabel: string;
  onSubmit: (draft: ChoreDraft) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "general");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "easy");
  const [reward, setReward] = useState(String(initial?.reward ?? 1));
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "anytime");
  const [requiresApproval, setRequiresApproval] = useState(initial?.requiresApproval ?? false);

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      reward: Number(reward) || 0,
      recurrence,
      requiresApproval,
    });
  };

  return (
    <div className="card stack-sm">
      <div className="field">
        <label>Chore</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Clean the bathroom" />
      </div>
      <div className="field">
        <label>Description</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Reward</label>
          <input className="input" type="number" min="0" step="0.5" value={reward} onChange={(e) => setReward(e.target.value)} />
        </div>
        <div className="field">
          <label>Difficulty</label>
          <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {Object.entries(DIFFICULTY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Repeats</label>
          <select className="select" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
            {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="card-row" style={{ padding: "4px 2px" }}>
        <span>Needs a parent&apos;s approval</span>
        <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
      </label>
      <div className="btn-row">
        <button className="btn btn-primary" disabled={!title.trim()} onClick={submit}>
          {submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
