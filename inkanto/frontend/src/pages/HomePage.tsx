import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { t } from "../i18n";
import type { Story } from "../types";
import ThemeSwitcher from "../components/ThemeSwitcher";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    api<Story[]>("/stories").then(setStories).catch(() => {});
  }, []);

  const createStory = async (e: FormEvent) => {
    e.preventDefault();
    const story = await api<Story>("/stories", { method: "POST", body: JSON.stringify({ title }) });
    navigate(`/storia/${story.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <header className="rise-in flex items-center justify-between py-4">
        <div>
          <h1 className="text-3xl text-accent">✨ Inkanto</h1>
          <p className="text-muted italic text-sm">
            Ciao, {user?.display_name}!
          </p>
        </div>
        <button className="btn-ghost text-sm" onClick={logout}>
          {t("logout")}
        </button>
      </header>

      <div className="rise-in flex justify-end mb-2" style={{ ["--rise-delay" as string]: "60ms" }}>
        <ThemeSwitcher />
      </div>

      <h2 className="rise-in text-xl mt-4 mb-3" style={{ ["--rise-delay" as string]: "100ms" }}>
        {t("my_stories")}
      </h2>

      {stories.length === 0 && !creating && (
        <div className="rise-in card p-8 text-center text-muted italic" style={{ ["--rise-delay" as string]: "160ms" }}>
          {t("empty_stories")}
        </div>
      )}

      <div className="space-y-3">
        {stories.map((s, i) => (
          <Link
            key={s.id}
            to={`/storia/${s.id}`}
            className="rise-in card card-tap block p-5"
            style={{ ["--rise-delay" as string]: `${140 + Math.min(i, 8) * 60}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl">{s.title}</h3>
              <span className="text-xs rounded-full bg-surface-2 border border-line px-3 py-1 shrink-0">
                {s.status === "finita" ? "🏁" : "✍️"}
              </span>
            </div>
            {s.idea && <p className="text-muted text-sm mt-1 line-clamp-2 italic">{s.idea}</p>}
          </Link>
        ))}
      </div>

      {creating ? (
        <form onSubmit={createStory} className="pop-in card p-5 mt-4 space-y-3">
          <label className="block text-sm text-muted">{t("new_story_title")}</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
          <div className="flex gap-2">
            <button type="submit" className="btn-spark flex-1">{t("create")}</button>
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
              {t("cancel")}
            </button>
          </div>
        </form>
      ) : (
        <button
          className="rise-in btn-spark w-full mt-6 text-lg py-3"
          style={{ ["--rise-delay" as string]: `${200 + Math.min(stories.length, 8) * 60}ms` }}
          onClick={() => setCreating(true)}
        >
          + {t("new_story")}
        </button>
      )}
    </div>
  );
}
