"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, KeyRound, RefreshCw, Server } from "lucide-react";
import { RELAY_HTTP_URL } from "@/lib/SecondBrainContext";
import { detectOllama, type OllamaStatus } from "@/lib/ollamaClient";
import { NoteStore } from "@/lib/store";
import {
  AI_MODEL_OPTIONS,
  AiProvider,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
} from "@/lib/types";

interface AiSettingsPanelProps {
  store: NoteStore;
  version: number;
}

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function displayModelName(name: string): string {
  return name.replace(/:latest$/, "");
}

export function AiSettingsPanel({ store, version }: AiSettingsPanelProps) {
  const saved = store.getAiSettings();
  const [provider, setProvider] = useState<AiProvider>(saved.provider);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl);
  const [model, setModel] = useState(saved.model);
  const [savedFlash, setSavedFlash] = useState(false);
  const [ollama, setOllama] = useState<OllamaStatus>({ running: false, models: [] });
  const [detecting, setDetecting] = useState(false);

  const refreshOllama = useCallback(async (url: string) => {
    setDetecting(true);
    try {
      const status = await detectOllama(url, RELAY_HTTP_URL);
      setOllama(status);
      return status;
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    const s = store.getAiSettings();
    setProvider(s.provider);
    setBaseUrl(s.baseUrl);
    setModel(s.model);
    setApiKeyInput("");
  }, [store, version]);

  useEffect(() => {
    if (provider !== "ollama") return;
    const timer = setTimeout(() => {
      void refreshOllama(baseUrl);
    }, 350);
    return () => clearTimeout(timer);
  }, [provider, baseUrl, refreshOllama]);

  useEffect(() => {
    if (provider !== "ollama" || !ollama.running || ollama.models.length === 0) return;
    if (!model || !ollama.models.includes(model)) {
      setModel(ollama.models[0]);
    }
  }, [provider, ollama, model]);

  const save = () => {
    const patch: {
      provider: AiProvider;
      apiKey?: string;
      baseUrl: string;
      model: string;
    } = {
      provider,
      baseUrl: baseUrl.trim() || DEFAULT_OLLAMA_BASE_URL,
      model: model.trim() || (provider === "ollama" ? DEFAULT_OLLAMA_MODEL : "gpt-4o-mini"),
    };
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

  const switchProvider = (next: AiProvider) => {
    setProvider(next);
    if (next === "openai" && !AI_MODEL_OPTIONS.includes(model as (typeof AI_MODEL_OPTIONS)[number])) {
      setModel("gpt-4o-mini");
    }
  };

  const hasOpenAiKey = saved.provider === "openai" && saved.apiKey.length > 0;

  return (
    <div className="ai-settings-panel stack-sm">
      <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
        AI settings live in your encrypted vault. Use <strong>OpenAI</strong> (cloud API key) or{" "}
        <strong>Ollama</strong> (local models on your machine — no key needed).
      </p>

      <div className="field">
        <label>Provider</label>
        <div className="btn-row">
          <button
            type="button"
            className={`pill-btn ${provider === "openai" ? "active" : ""}`}
            onClick={() => switchProvider("openai")}
          >
            OpenAI
          </button>
          <button
            type="button"
            className={`pill-btn ${provider === "ollama" ? "active" : ""}`}
            onClick={() => switchProvider("ollama")}
          >
            Ollama (local)
          </button>
        </div>
      </div>

      {provider === "openai" ? (
        <div className="field">
          <label>
            <KeyRound size={12} style={{ display: "inline", marginRight: 4 }} />
            OpenAI API key
          </label>
          <input
            className="input"
            type="password"
            placeholder={hasOpenAiKey ? "Key saved — enter new key to replace" : "sk-…"}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {hasOpenAiKey && (
            <span className="muted" style={{ fontSize: 11 }}>
              Active: {maskKey(saved.apiKey)}
            </span>
          )}
        </div>
      ) : (
        <div className="field">
          <label>
            <Server size={12} style={{ display: "inline", marginRight: 4 }} />
            Ollama URL
          </label>
          <div className="btn-row" style={{ alignItems: "stretch" }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder={DEFAULT_OLLAMA_BASE_URL}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              spellCheck={false}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => void refreshOllama(baseUrl)}
              disabled={detecting}
              title="Refresh Ollama detection"
              aria-label="Refresh Ollama detection"
            >
              <RefreshCw size={14} className={detecting ? "pulse" : ""} />
            </button>
          </div>
          <div className="ollama-status-row">
            {detecting ? (
              <span className="sync-badge">
                <span className="dot" />
                Detecting Ollama…
              </span>
            ) : ollama.running ? (
              <span className="sync-badge">
                <span className="dot on" />
                Ollama running · {ollama.models.length} model
                {ollama.models.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="sync-badge">
                <span className="dot off" />
                Ollama not detected
              </span>
            )}
          </div>
          {!detecting && !ollama.running && (
            <span className="muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
              Start with <code>ollama serve</code>, pull a model with{" "}
              <code>ollama pull llama3.2</code>, then refresh.
            </span>
          )}
        </div>
      )}

      <div className="field">
        <label>
          <Bot size={12} style={{ display: "inline", marginRight: 4 }} />
          Model
        </label>
        {provider === "openai" ? (
          <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
            {AI_MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : ollama.running && ollama.models.length > 0 ? (
          <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
            {ollama.models.map((m) => (
              <option key={m} value={m}>
                {displayModelName(m)}
              </option>
            ))}
          </select>
        ) : (
          <select className="select" disabled value="">
            <option value="">
              {detecting ? "Detecting models…" : "No models — start Ollama first"}
            </option>
          </select>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-sm btn-primary" onClick={save}>
          {savedFlash ? "Saved" : "Save AI settings"}
        </button>
        {provider === "openai" && hasOpenAiKey && (
          <button className="btn btn-sm btn-ghost" onClick={clearKey}>
            Remove key
          </button>
        )}
      </div>
    </div>
  );
}
