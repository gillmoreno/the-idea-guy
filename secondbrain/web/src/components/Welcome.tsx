"use client";

import { useState } from "react";
import { Brain, Link2, Lock, Search, Sparkles, Wifi } from "lucide-react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { generateInviteCode } from "@/kit/invite";
import { ThemeToggle } from "./ThemeToggle";

const FEATURES = [
  { icon: Link2, label: "Internal links" },
  { icon: Search, label: "Full-text search" },
  { icon: Sparkles, label: "AI chat" },
  { icon: Lock, label: "E2E encrypted" },
];

export function Welcome() {
  const { join } = useSecondBrain();
  const [mode, setMode] = useState<"home" | "join">("home");
  const [code, setCode] = useState("");

  if (mode === "join") {
    return (
      <div className="landing">
        <div className="landing-glow landing-glow-a" />
        <div className="landing-glow landing-glow-b" />
        <div className="landing-card stack">
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <ThemeToggle />
          </div>
          <div>
            <h1 className="landing-title" style={{ fontSize: "1.6rem", textAlign: "left" }}>
              Join a vault
            </h1>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
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
            <Wifi size={16} />
            Join vault
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setMode("home")}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />
      <div className="landing-card">
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <ThemeToggle />
        </div>

        <div style={{ textAlign: "center" }}>
          <div className="hero-badge">
            <Brain size={12} />
            Local-first knowledge vault
          </div>
          <div className="hero-logo-wrap">🧠</div>
          <h1 className="landing-title">Second Brain</h1>
          <p className="muted" style={{ marginTop: 12, lineHeight: 1.65, fontSize: 15 }}>
            Beautiful HTML notes with internal links, search, and AI grounded in your
            own data. Everything stays on your devices.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="feature-pill">
              <Icon size={14} />
              {label}
            </div>
          ))}
        </div>

        <div className="stack" style={{ marginTop: 8 }}>
          <button
            className="btn btn-primary btn-block"
            onClick={() => join(generateInviteCode(), true)}
          >
            <Sparkles size={16} />
            Create a vault
          </button>
          <button className="btn btn-block" onClick={() => setMode("join")}>
            Join an existing vault
          </button>
        </div>

        <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          End-to-end encrypted sync. Add to your home screen to use it like a native app.
        </p>
      </div>
    </div>
  );
}
