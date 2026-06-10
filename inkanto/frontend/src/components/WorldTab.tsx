import { useState } from "react";
import { api } from "../api";
import { t } from "../i18n";
import type { Entity, StoryDetail } from "../types";
import type { CoachFocus } from "./CoachDrawer";

const KINDS: { kind: Entity["kind"]; labelKey: string; emoji: string }[] = [
  { kind: "character", labelKey: "characters", emoji: "🧑‍🎤" },
  { kind: "place", labelKey: "places", emoji: "🏰" },
  { kind: "object", labelKey: "objects", emoji: "🗝️" },
];

interface Props {
  story: StoryDetail;
  onChanged: () => void;
  onCoach: (focus: CoachFocus) => void;
}

export default function WorldTab({ story, onChanged, onCoach }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = story.entities.find((e) => e.id === openId) ?? null;

  if (open) {
    return (
      <EntityEditor
        entity={open}
        onBack={() => {
          setOpenId(null);
          onChanged();
        }}
        onCoach={onCoach}
      />
    );
  }

  return (
    <div className="space-y-6">
      {KINDS.map(({ kind, labelKey, emoji }) => {
        const items = story.entities.filter((e) => e.kind === kind);
        return (
          <section key={kind}>
            <h3 className="text-lg mb-2">{emoji} {t(labelKey)}</h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((e) => (
                <button key={e.id} onClick={() => setOpenId(e.id)} className="card p-3 text-left hover:border-accent/60">
                  <div className="font-bold">{e.name || "…"}</div>
                  <div className="text-xs text-muted line-clamp-2 italic">{e.summary}</div>
                </button>
              ))}
              <AddEntity storyId={story.id} kind={kind} onAdded={onChanged} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AddEntity({ storyId, kind, onAdded }: { storyId: number; kind: Entity["kind"]; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  if (!adding) {
    return (
      <button className="card p-3 text-muted border-dashed hover:text-accent" onClick={() => setAdding(true)}>
        + {t("add")}
      </button>
    );
  }

  const submit = async () => {
    if (!name.trim()) return setAdding(false);
    await api(`/stories/${storyId}/entities`, {
      method: "POST",
      body: JSON.stringify({ kind, name, summary: "" }),
    });
    setName("");
    setAdding(false);
    onAdded();
  };

  return (
    <div className="card p-3 space-y-2">
      <input
        className="input text-sm"
        placeholder={t("name_ph")}
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="btn-spark w-full py-1 text-sm" onClick={submit}>{t("add")}</button>
    </div>
  );
}

function EntityEditor({
  entity,
  onBack,
  onCoach,
}: {
  entity: Entity;
  onBack: () => void;
  onCoach: (focus: CoachFocus) => void;
}) {
  const [name, setName] = useState(entity.name);
  const [summary, setSummary] = useState(entity.summary);
  const [notes, setNotes] = useState(entity.notes);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await api(`/entities/${entity.id}`, { method: "PATCH", body: JSON.stringify({ name, summary, notes }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const remove = async () => {
    if (!confirm(t("confirm_delete"))) return;
    await api(`/entities/${entity.id}`, { method: "DELETE" });
    onBack();
  };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex gap-2">
        <button className="btn-ghost text-sm" onClick={async () => { await save(); onBack(); }}>← {t("back")}</button>
        <button className="btn-ghost text-sm ml-auto" onClick={remove}>🗑</button>
      </div>
      <input className="input text-lg" placeholder={t("name_ph")} value={name} onChange={(e) => setName(e.target.value)} />
      <textarea
        className="input min-h-20"
        placeholder={t("summary_ph")}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <textarea
        className="input min-h-28 text-sm"
        placeholder={t("notes_ph")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn-spark flex-1" onClick={save}>{saved ? t("saved") : t("save")}</button>
        <button
          className="btn-ghost"
          onClick={async () => {
            await save();
            onCoach({ entityId: entity.id, suggestedSkill: "intervista" });
          }}
        >
          🎤 {t("coach")}
        </button>
      </div>
    </div>
  );
}
