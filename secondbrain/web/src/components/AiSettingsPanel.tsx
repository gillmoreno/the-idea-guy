"use client";

import { useEffect, useState } from "react";
import { Bot, KeyRound } from "lucide-react";
import { NoteStore } from "@/lib/store";
import { AI_MODEL_OPTIONS } from "@/lib/types";

interface AiSettingsPanelProps {
  store: NoteStore;
  version: number;
}

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function AiSettingsPanel({ store, version }: AiSettingsPanelProps) {
  const saved = store.getAiSettings();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [model, setModel] = useState(saved.model);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setModel(store.getAiSettings().model);
    setApiKeyInput("");
  }, [store, version]);

  const save = () => {
    const patch: { apiKey?: string; model: string } = { model };
    const trimmed = apiKeyInput.trim();
    if (trimmed) patch.apiKey = trimmed;
    store.setAiSettings(patch);
    setApiKeyInput("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const clearKey = () => {
    store.setAiSettings({ apiKey: "" });
    setApiKeyInput("");
  };

  const hasSavedKey = store.hasAiKey();

  return (
    <div className="ai-settings-panel stack-sm">
      <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
        Your OpenAI key lives in this vault&apos;s encrypted database and syncs to your
        devices. The relay never stores or configures API keys — it only forwards requests
        when the browser needs a CORS tunnel.
      </p>
      <div className="field">
        <label>
          <KeyRound size={12} style={{ display: "inline", marginRight: 4 }} />
          OpenAI API key
        </label>
        <input
          className="input"
          type="password"
          placeholder={hasSavedKey ? "Key saved — enter new key to replace" : "sk-…"}
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {hasSavedKey && (
          <span className="muted" style={{ fontSize: 11 }}>
            Active: {maskKey(saved.apiKey)}
          </span>
        )}
      </div>
      <div className="field">
        <label>
          <Bot size={12} style={{ display: "inline", marginRight: 4 }} />
          Model
        </label>
        <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
          {AI_MODEL_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="btn-row">
        <button className="btn btn-sm btn-primary" onClick={save}>
          {savedFlash ? "Saved" : "Save AI settings"}
        </button>
        {hasSavedKey && (
          <button className="btn btn-sm btn-ghost" onClick={clearKey}>
            Remove key
          </button>
        )}
      </div>
    </div>
  );
}
