"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useScorePadStore } from "../lib/useScorePadStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useScorePadStore();
  const pad = store?.getPad();
  const players = store?.listPlayers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{pad?.name ?? "Score Pad"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {players.map((p) => (
            <button key={p.id} className="profile-card" onClick={() => setCurrentMember(p.id)}>
              <Avatar player={p} large />
              <div>
                <div className="name">{p.name}</div>
              </div>
            </button>
          ))}
        </div>
        {players.length === 0 ? (
          <div className="empty">No players yet. Anyone already in the room can add players from the pad.</div>
        ) : (
          <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
            Not listed? Anyone already in the room can add you from the pad.
          </p>
        )}
      </div>
    </div>
  );
}
