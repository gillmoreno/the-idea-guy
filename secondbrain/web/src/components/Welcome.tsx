"use client";

import { useState } from "react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { generateInviteCode } from "@/kit/invite";

export function Welcome() {
  const { join } = useSecondBrain();
  const [mode, setMode] = useState<"home" | "join">("home");
  const [code, setCode] = useState("");

  if (mode === "join") {
    return (
      <div className="centered">
        <div>
          <h1>Join a vault</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Enter the invite code from a device that&apos;s already set up. Your notes
            sync privately — no account needed.
          </p>
        </div>
        <div className="field">
          <label>Invite code</label>
          <input
            className="input"
            placeholder="amber-tiger-maple-river"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={!code.trim()} onClick={() => join(code)}>
          Join vault
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => setMode("home")}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="centered">
      <div style={{ textAlign: "center" }}>
        <div className="hero-logo">🧠</div>
        <h1 style={{ marginTop: 8 }}>Second Brain</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Your personal knowledge vault — HTML notes, internal links, search, and AI
          chat grounded in your own data. Everything stays on your devices.
        </p>
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={() => join(generateInviteCode(), true)}
      >
        Create a vault
      </button>
      <button className="btn btn-block" onClick={() => setMode("join")}>
        Join an existing vault
      </button>
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>
        Local-first &amp; end-to-end encrypted. Add it to your home screen to use
        it like an app.
      </p>
    </div>
  );
}
