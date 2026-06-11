import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, coachStream } from "../api";
import { getLocale, t } from "../i18n";
import type { CoachMessage, SkillInfo, StoryDetail } from "../types";

export interface CoachFocus {
  chapterId?: number;
  entityId?: number;
  suggestedSkill?: string;
}

interface Props {
  story: StoryDetail;
  focus: CoachFocus;
  onClose: () => void;
}

export default function CoachDrawer({ story, focus, onClose }: Props) {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [skill, setSkill] = useState(focus.suggestedSkill || "scintilla");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<SkillInfo[]>("/skills").then(setSkills).catch(() => {});
  }, []);

  useEffect(() => {
    api<CoachMessage[]>(`/stories/${story.id}/coach/${skill}`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [story.id, skill]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError("");
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { skill, role: "user", content: text }, { skill, role: "assistant", content: "" }]);
    try {
      await coachStream(
        story.id,
        { skill, message: text, chapter_id: focus.chapterId, entity_id: focus.entityId },
        (chunk) =>
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          })
      );
    } catch {
      setError(t("coach_error"));
      setMessages((m) => (m[m.length - 1]?.content === "" ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
    }
  };

  const locale = getLocale();

  return (
    <div className="coach-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="coach-sheet absolute inset-x-0 bottom-0 top-14 rounded-t-3xl bg-bg border-t border-line flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-line">
          <span className="text-2xl">🧞</span>
          <h2 className="text-xl text-accent flex-1">{t("coach")}</h2>
          <button className="btn-ghost px-3 py-1" onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-1 p-2 overflow-x-auto border-b border-line">
          {skills.map((s) => (
            <button
              key={s.name}
              onClick={() => setSkill(s.name)}
              className={`text-xs whitespace-nowrap ${skill === s.name ? "chip-pop" : "chip"}`}
              title={s.description}
            >
              {s.emoji} {s.titles[locale] ?? s.titles.it}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`coach-bubble pop-in max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-accent text-accent-fg rounded-br-md"
                  : "bg-surface-2 text-fg border border-line rounded-bl-md"
              }`}
            >
              {m.content ||
                (busy && i === messages.length - 1 ? (
                  <span className="inline-flex items-center gap-2 text-muted">
                    {t("coach_thinking")}
                    <span className="thinking-dots" aria-hidden>
                      <span /><span /><span />
                    </span>
                  </span>
                ) : (
                  ""
                ))}
            </div>
          ))}
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 p-3 border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <input
            className="input flex-1"
            placeholder={t("coach_input_ph")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button className="btn-spark px-5" disabled={busy || !input.trim()}>➤</button>
        </form>
      </div>
    </div>
  );
}
