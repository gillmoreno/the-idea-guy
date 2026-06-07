"use client";

import { useEffect, useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { parseAppSearchParams, stripInviteParamsFromUrl } from "@the-idea-guy/room-kit";

/** Parent profile selected but this device has no parent secret (kid join flow). */
export function ParentGate() {
  const { unlockAdmin, setCurrentMember } = useRoomSession();
  const [secret, setSecret] = useState("");

  useEffect(() => {
    const link = parseAppSearchParams(window.location.search);
    if (link?.type === "parent") {
      setSecret(link.value);
      stripInviteParamsFromUrl();
      unlockAdmin(link.value);
    }
  }, [unlockAdmin]);

  return (
    <div className="centered">
      <div>
        <h1>Parent access</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          This device joined with a <strong>family code</strong> only. Paste the{" "}
          <strong>parent secret</strong> to manage chores, approvals, and payday. Kids
          should never have this code.
        </p>
      </div>
      <div className="field">
        <label>Parent secret</label>
        <input
          className="input"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Paste parent secret"
        />
      </div>
      <button
        className="btn btn-primary btn-block"
        disabled={!secret.trim()}
        onClick={() => unlockAdmin(secret)}
      >
        Unlock parent mode
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => setCurrentMember(null)}>
        Switch profile
      </button>
    </div>
  );
}
