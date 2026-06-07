"use client";

import { useState } from "react";
import { Bot, FileText, Send, Settings, Sparkles, X } from "lucide-react";
import { AiMarkdown } from "@/components/AiMarkdown";
import { askVaultAI } from "@/lib/aiClient";
import { RELAY_HTTP_URL, useSecondBrain } from "@/lib/SecondBrainContext";
import { AICitation, AIChatMessage } from "@/lib/types";
import { NoteStore } from "@/lib/store";

interface AIPanelProps {
  activeNoteId: string | null;
  onClose: () => void;
  onOpenSettings?: () => void;
}

function resolveCitations(
  cited: AICitation[] | string[] | undefined,
  store: NoteStore | null,
): AICitation[] {
  if (!cited?.length) return [];
  if (typeof cited[0] === "string") {
    return (cited as string[])
      .map((title) => {
        const note = store?.listNotes().find((n) => n.title === title);
        return note ? { id: note.id, title: note.title } : null;
      })
      .filter((c): c is AICitation => c != null);
  }
  return (cited as AICitation[]).filter((c) => c.id);
}

export function AIPanel({ activeNoteId, onClose, onOpenSettings }: AIPanelProps) {
  const { store, searchIndex, setActiveNoteId } = useSecondBrain();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolStep, setToolStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aiSettings = store?.getAiSettings();
  const hasKey = store?.hasAiConfigured() ?? false;

  const ask = async (question: string, mode: "chat" | "summarize" = "chat") => {
    if (!store || !question.trim()) return;
    if (!hasKey) {
      setError("Configure AI in Settings → AI (OpenAI key or local Ollama).");
      return;
    }

    setLoading(true);
    setToolStep(null);
    setError(null);
    const userMsg: AIChatMessage = { role: "user", content: question };
    setMessages((m) => [...m, userMsg]);

    let relevantNotes: { id: string; title: string; plainText: string }[] = [];
    if (mode === "summarize" && activeNoteId) {
      const note = store.getNote(activeNoteId);
      if (note) {
        relevantNotes = [
          { id: note.id, title: note.title, plainText: store.getLivePlainText(note.id) },
        ];
      }
    }

    try {
      const settings = store.getAiSettings();
      const data = await askVaultAI(
        { question, relevantNotes, mode },
        { settings, relayHttpUrl: RELAY_HTTP_URL },
        { store, searchIndex, activeNoteId },
        (label) => setToolStep(label),
      );
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer,
          citedNotes: data.citedNotes,
          toolSteps: data.toolSteps,
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI unavailable";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
      setToolStep(null);
      setInput("");
    }
  };

  const summarize = () => {
    if (!activeNoteId || !store) return;
    const note = store.getNote(activeNoteId);
    if (!note) return;
    void ask(`Summarize this note titled "${note.title}":`, "summarize");
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={18} />
          AI Assistant
        </h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close AI panel">
          <X size={16} />
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, padding: "0 18px", lineHeight: 1.5 }}>
        Agent with local vault tools (search, count, dates). Tools run in your browser — only
        results go to the model. Keys stay in your vault, not on the relay.
      </p>

      {!hasKey && (
        <div className="ai-setup-banner">
          <p style={{ fontSize: 13, fontWeight: 600 }}>Set up AI</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
            Add an OpenAI key or point to local Ollama in Settings.
          </p>
          {onOpenSettings && (
            <button className="btn btn-sm btn-primary" style={{ marginTop: 10 }} onClick={onOpenSettings}>
              <Settings size={14} />
              Open AI settings
            </button>
          )}
        </div>
      )}

      {hasKey && aiSettings && (
        <p className="muted" style={{ fontSize: 11, padding: "0 18px 8px" }}>
          {aiSettings.provider === "ollama" ? "Ollama" : "OpenAI"} · {aiSettings.model}
          {aiSettings.provider === "ollama" && ` · ${aiSettings.baseUrl}`}
        </p>
      )}

      {activeNoteId && hasKey && (
        <div style={{ padding: "0 18px 10px" }}>
          <button className="pill-btn" onClick={summarize} disabled={loading}>
            <Sparkles size={13} />
            Summarize this note
          </button>
        </div>
      )}
      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="empty" style={{ fontSize: 13, padding: "24px 0" }}>
            <Bot size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            {hasKey ? "Ask anything about your notes…" : "Set up your API key to start."}
          </div>
        )}
        {messages.map((m, i) => {
          const citations = resolveCitations(m.citedNotes, store);
          return (
            <div key={i} className={`ai-msg ai-msg-${m.role}`}>
              <div className="ai-msg-content">
                {m.role === "assistant" ? (
                  <AiMarkdown
                    content={m.content}
                    citations={citations}
                    onOpenNote={setActiveNoteId}
                  />
                ) : (
                  m.content
                )}
              </div>
              {m.toolSteps && m.toolSteps.length > 0 && (
                <div className="ai-tool-steps muted">
                  {m.toolSteps.map((s, j) => (
                    <span key={j} className="ai-tool-step">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {citations.length > 0 && (
                <div className="ai-cited">
                  <span className="ai-cited-label muted">Sources</span>
                  <div className="ai-cite-list">
                    {citations.map((cite) => (
                      <button
                        key={cite.id}
                        type="button"
                        className="ai-cite-link"
                        title={`Open "${cite.title}"`}
                        onClick={() => setActiveNoteId(cite.id)}
                      >
                        <FileText size={12} aria-hidden />
                        {cite.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="muted" style={{ padding: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} className="pulse" />
            {toolStep ?? "Thinking…"}
          </div>
        )}
        {error && <div className="ai-error">{error}</div>}
      </div>
      <div className="ai-input-row">
        <input
          className="input"
          placeholder={hasKey ? "Ask your vault…" : "Add API key in Settings first"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && hasKey && ask(input)}
          disabled={loading || !hasKey}
        />
        <button
          className="btn btn-primary btn-sm"
          disabled={loading || !input.trim() || !hasKey}
          onClick={() => ask(input)}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
