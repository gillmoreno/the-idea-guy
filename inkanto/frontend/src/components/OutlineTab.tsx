import { useState } from "react";
import { api } from "../api";
import { t } from "../i18n";
import type { Beat, StoryDetail } from "../types";

export default function OutlineTab({ story, onSaved }: { story: StoryDetail; onSaved: () => void }) {
  const [beats, setBeats] = useState<Beat[]>(story.beats);
  const [saved, setSaved] = useState(false);

  const update = (i: number, patch: Partial<Beat>) =>
    setBeats(beats.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= beats.length) return;
    const next = [...beats];
    [next[i], next[j]] = [next[j], next[i]];
    setBeats(next);
  };

  const save = async () => {
    await api(`/stories/${story.id}/outline`, { method: "PUT", body: JSON.stringify({ beats }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved();
  };

  return (
    <div className="space-y-3">
      {beats.map((b, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-start gap-2">
            <span className="text-accent font-bold text-lg w-7 shrink-0 pt-1">{i + 1}.</span>
            <div className="flex-1 space-y-2">
              <input
                className="input"
                placeholder={t("beat_title_ph")}
                value={b.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
              <textarea
                className="input min-h-16 text-sm"
                placeholder={t("beat_summary_ph")}
                value={b.summary}
                onChange={(e) => update(i, { summary: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => move(i, -1)}>↑</button>
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => move(i, 1)}>↓</button>
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => setBeats(beats.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          className="btn-ghost flex-1"
          onClick={() => setBeats([...beats, { title: "", summary: "" }])}
        >
          + {t("add_beat")}
        </button>
        <button className="btn-spark" onClick={save}>{saved ? t("saved") : t("save")}</button>
      </div>
    </div>
  );
}
