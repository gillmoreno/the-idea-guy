"use client";

import { useState } from "react";
import { AI_URL, useSecondBrain } from "@/lib/SecondBrainContext";
import { AIChatMessage } from "@/lib/types";

interface AIPanelProps {
  activeNoteId: string | null;
  onClose: () => void;
}

export function AIPanel({ activeNoteId, onClose }: AIPanelProps) {
  const { store, searchIndex } = useSecondBrain();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string, mode: "chat" | "summarize" = "chat") => {
    if (!store || !question.trim()) return;
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
      const res = await fetch(`${AI_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, relevantNotes, mode }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `AI request failed (${res.status})`);
      }
      const data = (await res.json()) as { answer: string; citedNotes: string[] };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, citedNotes: data.citedNotes },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI unavailable";
      setError(msg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "AI is unavailable. Set OPENAI_API_KEY on the relay and ensure NEXT_PUBLIC_AI_URL points to it.",
        },
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
        <h3>AI Assistant</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, padding: "0 16px" }}>
        Answers use keyword-matched note excerpts only — your full vault never leaves the device.
      </p>
      {activeNoteId && (
        <div style={{ padding: "0 16px 8px" }}>
          <button className="btn btn-sm" onClick={summarize} disabled={loading}>
            Summarize this note
          </button>
        </div>
      )}
      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="empty" style={{ fontSize: 13 }}>
            Ask anything about your notes…
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
        {loading && <div className="muted" style={{ padding: 8 }}>Thinking…</div>}
        {error && <div className="ai-error">{error}</div>}
      </div>
      <div className="ai-input-row">
        <input
          className="input"
          placeholder="Ask your vault…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && ask(input)}
          disabled={loading}
        />
        <button className="btn btn-primary btn-sm" disabled={loading || !input.trim()} onClick={() => ask(input)}>
          Send
        </button>
      </div>
    </div>
  );
}
