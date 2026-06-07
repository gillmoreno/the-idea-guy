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
} from "@/templates/choreboard/lib/types";
import { DEFAULT_FREQUENCY_LIMIT, resolveFrequencyLimit } from "@/templates/choreboard/lib/frequency";
import { ConfirmModal } from "@/components/ConfirmModal";

export interface ChoreDraft {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number;
  frequencyLimit: ChoreFrequencyLimit;
  requiresApproval: boolean;
}

type FrequencyMode = "anytime" | "scheduled";

const PERIOD_OPTIONS: { value: FrequencyPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "ever", label: "One-time" },
];

function initialLimit(chore?: Partial<Chore>): ChoreFrequencyLimit {
  const resolved = chore ? resolveFrequencyLimit(chore as Chore) : null;
  if (resolved) return resolved;
  if (chore?.frequencyLimit) return chore.frequencyLimit;
  return DEFAULT_FREQUENCY_LIMIT;
}

function initialMode(chore?: Partial<Chore>): FrequencyMode {
  const limit = initialLimit(chore);
  return limit.maxCompletions <= 0 ? "anytime" : "scheduled";
}

export function ChoreForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onArchive,
}: {
  initial?: Partial<Chore>;
  submitLabel: string;
  onSubmit: (draft: ChoreDraft) => void;
  onCancel?: () => void;
  onArchive?: () => void;
}) {
  const startLimit = initialLimit(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "general");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "easy");
  const [reward, setReward] = useState(String(initial?.reward ?? 1));
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>(initialMode(initial));
  const [maxCompletions, setMaxCompletions] = useState(
    String(startLimit.maxCompletions > 0 ? startLimit.maxCompletions : 1),
  );
  const [period, setPeriod] = useState<FrequencyPeriod>(
    startLimit.maxCompletions > 0 ? startLimit.period : "day",
  );
  const [requiresApproval, setRequiresApproval] = useState(initial?.requiresApproval ?? false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    const frequencyLimit: ChoreFrequencyLimit =
      frequencyMode === "anytime"
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
    <>
      <div className="chore-form card">
        <div className="form-section">
          <div className="form-section-label">Basics</div>
          <div className="field">
            <label>Chore name</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean the bathroom"
            />
          </div>
          <div className="field">
            <label>Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details for kids"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-label">Reward &amp; difficulty</div>
          <div className="grid-2">
            <div className="field">
              <label>Reward</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.5"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Difficulty</label>
              <select
                className="select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                {Object.entries(DIFFICULTY_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Category</label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.entries(CATEGORY_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-label">How often can kids do this?</div>
          <div className="segmented" role="group" aria-label="Frequency mode">
            <button
              type="button"
              className={frequencyMode === "anytime" ? "active" : ""}
              onClick={() => setFrequencyMode("anytime")}
            >
              Anytime
            </button>
            <button
              type="button"
              className={frequencyMode === "scheduled" ? "active" : ""}
              onClick={() => setFrequencyMode("scheduled")}
            >
              On a schedule
            </button>
          </div>
          {frequencyMode === "scheduled" ? (
            <div className="cadence-panel">
              <div className="grid-2">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Times</label>
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
                  <label>Per</label>
                  <select
                    className="select"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as FrequencyPeriod)}
                  >
                    {PERIOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="form-hint">
                Pending completions count toward the limit. Rejected ones free a slot.
              </p>
            </div>
          ) : (
            <p className="form-hint">Kids can mark this chore done as many times as they want.</p>
          )}
        </div>

        <div className="form-section">
          <label className="toggle-row">
            <div>
              <div className="toggle-label">Needs parent approval</div>
              <div className="toggle-hint">Medium and hard chores usually need this.</div>
            </div>
            <input
              type="checkbox"
              className="toggle-input"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
            />
            <span className="toggle-track" aria-hidden />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary btn-block" disabled={!title.trim()} onClick={submit}>
            {submitLabel}
          </button>
          {onCancel && (
            <button className="btn btn-ghost btn-block" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>

        {onArchive && (
          <div className="form-danger-zone">
            <div className="form-danger-label">Danger zone</div>
            <p className="form-hint">
              Archiving removes this chore from kids&apos; lists. History is kept, but they
              won&apos;t see it anymore.
            </p>
            <button className="btn btn-danger-outline btn-block" onClick={() => setArchiveOpen(true)}>
              Archive this chore
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={archiveOpen}
        variant="danger"
        icon="📦"
        title="Archive this chore?"
        message={
          <>
            <strong>{title || "This chore"}</strong> will disappear from your kids&apos; chore
            lists. You can&apos;t undo this from the app — you&apos;d need to add it again.
          </>
        }
        confirmLabel="Yes, archive"
        cancelLabel="Keep it"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => {
          setArchiveOpen(false);
          onArchive?.();
        }}
      />
    </>
  );
}
