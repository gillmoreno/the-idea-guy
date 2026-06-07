"use client";

import { useState } from "react";
import { Bot, Send, Settings, Sparkles, X } from "lucide-react";
import { askVaultAI } from "@/lib/aiClient";
import { RELAY_HTTP_URL, useSecondBrain } from "@/lib/SecondBrainContext";
import { AIChatMessage } from "@/lib/types";

interface AIPanelProps {
  activeNoteId: string | null;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function AIPanel({ activeNoteId, onClose, onOpenSettings }: AIPanelProps) {
  const { store, searchIndex } = useSecondBrain();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiSettings = store?.getAiSettings();
  const hasKey = store?.hasAiKey() ?? false;

  const ask = async (question: string, mode: "chat" | "summarize" = "chat") => {
    if (!store || !question.trim()) return;
    if (!hasKey) {
      setError("Add your OpenAI API key in Settings → AI.");
      return;
    }

    setLoading(true);
    setError(null);
    const userMsg: AIChatMessage = { role: "user", content: question };
    setMessages((m) => [...m, userMsg]);

    let relevantNotes = searchIndex.retrieveForAI(question, 5);
    if (mode === "summarize" && activeNoteId) {
      const note = store.getNote(activeNoteId);
      if (note) {
        relevantNotes = [{ id: note.id, title: note.title, plainText: note.plainText }];
      }
    }

    try {
      const settings = store.getAiSettings();
      const data = await askVaultAI(
        { question, relevantNotes, mode },
        {
          apiKey: settings.apiKey,
          model: settings.model,
          relayHttpUrl: RELAY_HTTP_URL,
        },
      );
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, citedNotes: data.citedNotes },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI unavailable";
      setError(msg);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: msg },
      ]);
    } finally {
      setLoading(false);
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
        Uses keyword-matched note excerpts only. Your key is stored in your vault — not on
        the relay.
      </p>

      {!hasKey && (
        <div className="ai-setup-banner">
          <p style={{ fontSize: 13, fontWeight: 600 }}>Connect your OpenAI key</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
            Add an API key in Settings to enable chat and summarize.
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
          Model: {aiSettings.model}
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
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ai-msg-${m.role}`}>
            <div className="ai-msg-content">{m.content}</div>
            {m.citedNotes && m.citedNotes.length > 0 && (
              <div className="ai-cited muted">
                Sources: {m.citedNotes.join(", ")}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="muted" style={{ padding: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} className="pulse" />
            Thinking…
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
