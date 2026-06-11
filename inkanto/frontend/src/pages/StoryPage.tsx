import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { t } from "../i18n";
import type { StoryDetail } from "../types";
import OutlineTab from "../components/OutlineTab";
import ChaptersTab from "../components/ChaptersTab";
import WorldTab from "../components/WorldTab";
import BookTab from "../components/BookTab";
import CoachDrawer, { type CoachFocus } from "../components/CoachDrawer";

type Tab = "idea" | "outline" | "chapters" | "world" | "book";

export default function StoryPage() {
  const { storyId } = useParams();
  const id = Number(storyId);
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [tab, setTab] = useState<Tab>("idea");
  const [coachOpen, setCoachOpen] = useState(false);
  const [focus, setFocus] = useState<CoachFocus>({});

  const reload = () => api<StoryDetail>(`/stories/${id}`).then(setStory).catch(() => {});

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!story) {
    return <div className="min-h-dvh grid place-items-center text-4xl animate-pulse">✨</div>;
  }

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "idea", label: t("tab_idea"), emoji: "💡" },
    { key: "outline", label: t("tab_outline"), emoji: "🪜" },
    { key: "chapters", label: t("tab_chapters"), emoji: "📖" },
    { key: "world", label: t("tab_world"), emoji: "🌍" },
    { key: "book", label: t("tab_book"), emoji: "📕" },
  ];

  const openCoach = (f: CoachFocus = {}) => {
    setFocus(f);
    setCoachOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28">
      <header className="flex items-center gap-3 py-3">
        <Link to="/" className="btn-ghost text-sm shrink-0">← {t("back")}</Link>
        <h1 className="text-2xl text-accent truncate">{story.title}</h1>
      </header>

      <nav className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-sm whitespace-nowrap ${tab === key ? "chip-active" : "chip"}`}
          >
            {emoji} {label}
          </button>
        ))}
      </nav>

      <div key={tab} className="rise-in">
        {tab === "idea" && <IdeaTab story={story} onSaved={reload} onCoach={openCoach} />}
        {tab === "outline" && <OutlineTab story={story} onSaved={reload} />}
        {tab === "chapters" && <ChaptersTab story={story} onChanged={reload} onCoach={openCoach} />}
        {tab === "world" && <WorldTab story={story} onChanged={reload} onCoach={openCoach} />}
        {tab === "book" && <BookTab story={story} onChanged={reload} />}
      </div>

      <button
        onClick={() => openCoach({})}
        className="fab-coach fixed bottom-5 right-5 h-16 w-16 rounded-full bg-pop text-3xl shadow-xl active:scale-95 transition"
        style={{ boxShadow: "0 4px 0 var(--pop-edge), 0 10px 24px rgb(0 0 0 / 0.25)" }}
        aria-label={t("coach")}
      >
        🧞
      </button>

      {coachOpen && <CoachDrawer story={story} focus={focus} onClose={() => setCoachOpen(false)} />}
    </div>
  );
}

function IdeaTab({
  story,
  onSaved,
  onCoach,
}: {
  story: StoryDetail;
  onSaved: () => void;
  onCoach: (focus: CoachFocus) => void;
}) {
  const [title, setTitle] = useState(story.title);
  const [idea, setIdea] = useState(story.idea);
  const [voice, setVoice] = useState(story.voice);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await api(`/stories/${story.id}`, { method: "PATCH", body: JSON.stringify({ title, idea, voice }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onSaved();
  };

  return (
    <div className="card p-5 space-y-4">
      <input className="input text-xl" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div>
        <label className="block mb-1">{t("idea_label")}</label>
        <p className="text-sm text-muted italic mb-2">{t("idea_hint")}</p>
        <textarea
          className="input min-h-32"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1">🪶 {t("voice_label")}</label>
        <p className="text-sm text-muted italic mb-2">{t("voice_hint")}</p>
        <textarea
          className="input min-h-24"
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
        />
        <button
          className="btn-ghost text-sm mt-2"
          onClick={async () => {
            await save();
            onCoach({ suggestedSkill: "voce" });
          }}
        >
          🪶 {t("find_voice")}
        </button>
      </div>
      <button className="btn-spark" onClick={save}>{saved ? t("saved") : t("save")}</button>
    </div>
  );
}
