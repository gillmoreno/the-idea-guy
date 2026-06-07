"use client";

import { useState } from "react";
import {
  CATEGORY_META,
  Category,
  Chore,
  ChoreFrequencyLimit,
  DIFFICULTY_META,
  Difficulty,
  FrequencyPeriod,
} from "@/lib/types";
import { DEFAULT_FREQUENCY_LIMIT, resolveFrequencyLimit } from "@/lib/frequency";

export interface ChoreDraft {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number;
  frequencyLimit: ChoreFrequencyLimit;
  requiresApproval: boolean;
}

const PERIOD_LABELS: Record<FrequencyPeriod, string> = {
  day: "day",
  week: "week",
  month: "month",
  ever: "ever (one-time)",
};

function initialLimit(chore?: Partial<Chore>): ChoreFrequencyLimit {
  const resolved = chore ? resolveFrequencyLimit(chore as Chore) : null;
  if (resolved) return resolved;
  if (chore?.frequencyLimit) return chore.frequencyLimit;
  return DEFAULT_FREQUENCY_LIMIT;
}

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
  const startLimit = initialLimit(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "general");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "easy");
  const [reward, setReward] = useState(String(initial?.reward ?? 1));
  const [unlimited, setUnlimited] = useState(startLimit.maxCompletions <= 0);
  const [maxCompletions, setMaxCompletions] = useState(
    String(startLimit.maxCompletions > 0 ? startLimit.maxCompletions : 1),
  );
  const [period, setPeriod] = useState<FrequencyPeriod>(
    startLimit.maxCompletions > 0 ? startLimit.period : "day",
  );
  const [requiresApproval, setRequiresApproval] = useState(initial?.requiresApproval ?? false);

  const submit = () => {
    if (!title.trim()) return;
    const frequencyLimit: ChoreFrequencyLimit = unlimited
      ? { maxCompletions: 0, period: "day" }
      : {
          maxCompletions: Math.max(1, Number(maxCompletions) || 1),
          period,
        };
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      reward: Number(reward) || 0,
      frequencyLimit,
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
      <div className="field">
        <label>Category</label>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {Object.entries(CATEGORY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>How often can kids mark this done?</label>
        <label className="card-row" style={{ padding: "4px 2px", marginBottom: 8 }}>
          <span>No limit</span>
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) => setUnlimited(e.target.checked)}
          />
        </label>
        {!unlimited && (
          <div className="grid-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Times</label>
              <input
                className="input"
                type="number"
                min="1"
                max="99"
                value={maxCompletions}
                onChange={(e) => setMaxCompletions(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Per</label>
              <select
                className="select"
                value={period}
                onChange={(e) => setPeriod(e.target.value as FrequencyPeriod)}
              >
                {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Default is once per day. Pending completions count toward the limit; rejected ones free a slot.
        </p>
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
