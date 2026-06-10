import { useState } from "react";
import { api } from "../api";
import { t } from "../i18n";
import type { Chapter, StoryDetail } from "../types";
import type { CoachFocus } from "./CoachDrawer";

interface Props {
  story: StoryDetail;
  onChanged: () => void;
  onCoach: (focus: CoachFocus) => void;
}

export default function ChaptersTab({ story, onChanged, onCoach }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = story.chapters.find((c) => c.id === openId) ?? null;

  if (open) {
    return (
      <ChapterEditor
        chapter={open}
        onBack={() => {
          setOpenId(null);
          onChanged();
        }}
        onCoach={onCoach}
      />
    );
  }

  const addChapter = async () => {
    await api(`/stories/${story.id}/chapters`, {
      method: "POST",
      body: JSON.stringify({ title: `Capitolo ${story.chapters.length + 1}` }),
    });
    onChanged();
  };

  return (
    <div className="space-y-3">
      {story.chapters.map((c) => (
        <button key={c.id} onClick={() => setOpenId(c.id)} className="card w-full p-4 text-left hover:border-accent/60">
          <div className="flex items-center justify-between">
            <span className="text-lg">{c.position + 1}. {c.title || "…"}</span>
            <span className="text-xs">{c.status === "finito" ? "🏁" : "✍️"}</span>
          </div>
          <p className="text-xs text-muted mt-1">{c.content.length} caratteri</p>
        </button>
      ))}
      <button className="btn-spark w-full py-3" onClick={addChapter}>+ {t("add_chapter")}</button>
    </div>
  );
}

function ChapterEditor({
  chapter,
  onBack,
  onCoach,
}: {
  chapter: Chapter;
  onBack: () => void;
  onCoach: (focus: CoachFocus) => void;
}) {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [status, setStatus] = useState(chapter.status);
  const [saved, setSaved] = useState(false);

  const save = async (patch: Partial<Chapter> = {}) => {
    const body = { title, content, status, ...patch };
    await api(`/chapters/${chapter.id}`, { method: "PATCH", body: JSON.stringify(body) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const remove = async () => {
    if (!confirm(t("confirm_delete"))) return;
    await api(`/chapters/${chapter.id}`, { method: "DELETE" });
    onBack();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className="btn-ghost text-sm" onClick={async () => { await save(); onBack(); }}>← {t("back")}</button>
        <button
          className="btn-ghost text-sm ml-auto"
          onClick={() => {
            const next = status === "finito" ? "bozza" : "finito";
            setStatus(next);
            save({ status: next });
          }}
        >
          {status === "finito" ? `🏁 ${t("status_finito")}` : `✍️ ${t("status_bozza")}`}
        </button>
        <button className="btn-ghost text-sm" onClick={remove}>🗑</button>
      </div>

      <input
        className="input text-lg"
        placeholder={t("chapter_title_ph")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="input min-h-[55dvh] leading-relaxed text-[1.05rem]"
        placeholder={t("write_here")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex gap-2">
        <button className="btn-spark flex-1" onClick={() => save()}>{saved ? t("saved") : t("save")}</button>
        <button
          className="btn-ghost"
          onClick={async () => {
            await save();
            onCoach({ chapterId: chapter.id, suggestedSkill: "e-poi" });
          }}
        >
          🧞 {t("coach")}
        </button>
      </div>
    </div>
  );
}
