"use client";

import { useState } from "react";
import { ROOM_SCHEMA_SYSTEM_PROMPT, ROOM_SCHEMA_USER_STARTER } from "@/schema/prompt";
import { EXAMPLE_SCHEMAS } from "@/schema/examples";

export function SchemaPromptPanel({
  onLoadExample,
}: {
  onLoadExample: (json: string) => void;
}) {
  const [copied, setCopied] = useState<"prompt" | "starter" | null>(null);

  const copy = async (text: string, kind: "prompt" | "starter") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback: user selects manually */
    }
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Generate with AI</div>
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
