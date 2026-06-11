"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useWhosInStore } from "../lib/useWhosInStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useWhosInStore();
  const event = store?.getEvent();
  const players = store?.listPlayers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{event?.name ?? "Who's In?"}</h1>
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
        {players.length === 0 && (
          <div className="empty">No players yet. Whoever set up the event can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
