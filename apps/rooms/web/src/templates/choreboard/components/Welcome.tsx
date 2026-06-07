"use client";

import { useEffect, useState } from "react";
import { useChoreBoard } from "@/shell/RoomSessionProvider";
import { generateFamilyCode, generateParentSecret } from "@the-idea-guy/room-kit";
import { parseJoinFromUrl, stripInviteParamsFromUrl } from "@the-idea-guy/room-kit";

export function Welcome() {
  const { join } = useChoreBoard();
  const [mode, setMode] = useState<"home" | "join">("home");
  const [code, setCode] = useState("");

  useEffect(() => {
    const fromUrl = parseJoinFromUrl(window.location.search);
    if (!fromUrl) return;
    stripInviteParamsFromUrl();
    join(fromUrl.trim());
  }, [join]);

  if (mode === "join") {
    return (
      <div className="centered">
        <div>
          <h1>Join your family</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Paste the <strong>family code</strong> from a parent (not the parent secret).
            Kids use this to sync chores and mark them done.
          </p>
        </div>
        <div className="field">
          <label>Family code</label>
          <input
            className="input"
            placeholder="Paste family code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={!code.trim()} onClick={() => join(code)}>
          Join family
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
        <div className="hero-logo">🧹💰</div>
        <h1 style={{ marginTop: 8 }}>ChoreBoard</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Turn chores into allowance. Kids sync with a family code; only parents hold
          the admin secret to change prices and approve payday.
        </p>
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={() => {
          const familyCode = generateFamilyCode();
          const parentSecret = generateParentSecret();
          join(familyCode, { asCreator: true, parentSecret });
        }}
      >
        Create a family
      </button>
      <button className="btn btn-block" onClick={() => setMode("join")}>
        Join an existing family
      </button>
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>
        Codes are random (~128-bit). Save the parent secret somewhere safe — it is
        never sent to our servers.
      </p>
    </div>
  );
}
