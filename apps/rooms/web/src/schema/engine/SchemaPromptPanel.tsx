"use client";

import { useEffect, useState } from "react";
import { ROOM_SCHEMA_SYSTEM_PROMPT, ROOM_SCHEMA_USER_STARTER } from "@/schema/prompt";
import { EXAMPLE_SCHEMAS } from "@/schema/examples";
import {
  GENERATION_ENABLED,
  MAX_DESCRIPTION_CHARS,
  generateErrorMessage,
  generateSchema,
} from "@/schema/generate";
import { FREE_SPELLS, spellsLeft, spendSpell } from "@/schema/spells";

export function SchemaPromptPanel({
  onLoadExample,
  onGenerated,
}: {
  onLoadExample: (json: string) => void;
  /** Called with pretty-printed JSON after a successful AI generation. */
  onGenerated?: (json: string) => void;
}) {
  const [copied, setCopied] = useState<"prompt" | "starter" | null>(null);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  // Start at the full allowance to keep server and client renders identical;
  // the real device count arrives after mount.
  const [left, setLeft] = useState(FREE_SPELLS);

  useEffect(() => {
    setLeft(spellsLeft());
  }, []);

  const copy = async (text: string, kind: "prompt" | "starter") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback: user selects manually */
    }
  };

  const runGenerate = async () => {
    const desc = description.trim();
    if (!desc || generating || left <= 0) return;
    setGenerating(true);
    setGenError(null);
    const result = await generateSchema(desc);
    setGenerating(false);
    if (result.ok) {
      spendSpell();
      setLeft(spellsLeft());
      const json = JSON.stringify(result.schema, null, 2);
      (onGenerated ?? onLoadExample)(json);
    } else {
      setGenError(generateErrorMessage(result.code));
    }
  };

  return (
    <div className="card stack-sm">
      {GENERATION_ENABLED && (
        <>
          <div className="section-title">Describe it</div>
          <p className="muted" style={{ fontSize: 13 }}>
            Say what your group needs. A room schema appears below, ready to create and share.
          </p>
          <textarea
            className="input"
            rows={3}
            maxLength={MAX_DESCRIPTION_CHARS}
            placeholder="e.g. my 4 roommates vote on what to cook this week"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setGenError(null);
            }}
            disabled={generating}
            spellCheck={false}
          />
          <div className="row gap-sm" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={runGenerate}
              disabled={generating || !description.trim() || left <= 0}
            >
              {generating ? "Conjuring…" : "✨ Generate room"}
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              {left} of {FREE_SPELLS} free generations left on this device
            </span>
          </div>
          {left <= 0 && (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              You&apos;ve used your free generations on this device — the copy-paste prompt below
              works with any AI chat, free and unlimited.
            </p>
          )}
          {genError && (
            <div className="card" style={{ borderColor: "var(--danger)", fontSize: 13 }}>
              {genError}
            </div>
          )}
        </>
      )}

      <div className="section-title" style={GENERATION_ENABLED ? { marginTop: 8 } : undefined}>
        {GENERATION_ENABLED ? "Or use your own AI chat" : "Generate with AI"}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        1. Copy the <strong>system prompt</strong> into a new ChatGPT / Claude / Grok chat.
        <br />
        2. Send the starter message (edit it) or describe your room.
        <br />
        3. Paste the JSON output below and validate.
      </p>
      <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => copy(ROOM_SCHEMA_SYSTEM_PROMPT, "prompt")}
        >
          {copied === "prompt" ? "Copied!" : "Copy system prompt"}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => copy(ROOM_SCHEMA_USER_STARTER, "starter")}
        >
          {copied === "starter" ? "Copied!" : "Copy starter message"}
        </button>
      </div>
      <details className="muted" style={{ fontSize: 12 }}>
        <summary style={{ cursor: "pointer" }}>Preview prompt</summary>
        <pre
          style={{
            marginTop: 8,
            padding: 10,
            background: "var(--surface-2)",
            borderRadius: 8,
            overflow: "auto",
            maxHeight: 160,
            fontSize: 11,
            whiteSpace: "pre-wrap",
          }}
        >
          {ROOM_SCHEMA_SYSTEM_PROMPT.slice(0, 600)}…
        </pre>
      </details>

      <div className="section-title" style={{ marginTop: 8 }}>
        Or try an example
      </div>
      <div className="stack-sm">
        {EXAMPLE_SCHEMAS.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className="btn btn-ghost btn-block"
            style={{ textAlign: "left" }}
            onClick={() => onLoadExample(JSON.stringify(ex.schema, null, 2))}
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
