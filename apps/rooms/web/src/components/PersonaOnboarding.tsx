"use client";

import { useState } from "react";
import { AccentColorField } from "@/components/AccentColorField";
import { AvatarField } from "@/components/AvatarField";
import { serializeAvatarValue } from "@/lib/avatarValue";
import { DEFAULT_ACCENT } from "@/lib/accentValue";

export function PersonaOnboarding({
  onCreate,
}: {
  onCreate: (name: string, color: string, avatar: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_ACCENT);
  const [avatar, setAvatar] = useState(() =>
    serializeAvatarValue({ kind: "emoji", emoji: "😊" }),
  );
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate(name.trim(), color, avatar);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="app-main stack" style={{ justifyContent: "center", minHeight: "100dvh" }}>
        <div className="card stack">
          <div className="section-title">Your persona</div>
          <p className="muted" style={{ fontSize: 14 }}>
            One identity for Rooms — a private key on this device, not an account on our servers.
            Share your contact code so friends can reach you when <strong>both</strong> of you
            accept.
          </p>
          <div className="field">
            <label>Display name</label>
            <input
              className="input"
              placeholder="Gil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Avatar</label>
            <AvatarField
              value={avatar}
              onChange={setAvatar}
              displayName={name}
              color={color}
            />
          </div>
          <div className="field">
            <label>Accent</label>
            <AccentColorField value={color} onChange={setColor} />
          </div>
          <button
            className="btn btn-primary btn-block"
            disabled={!name.trim() || busy}
            onClick={() => void finish()}
          >
            {busy ? "Creating…" : "Create persona"}
          </button>
        </div>
      </div>
    </div>
  );
}
