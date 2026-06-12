"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useSitCoopStore } from "../lib/useSitCoopStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useSitCoopStore();
  const coop = store?.getCoop();
  const families = store?.listFamilies() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{coop?.name ?? "Babysitting Co-op"}</h1>
          <div className="sub">Which family is this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {families.map((f) => (
            <button key={f.id} className="profile-card" onClick={() => setCurrentMember(f.id)}>
              <Avatar family={f} large />
              <div>
                <div className="name">{f.name}</div>
              </div>
            </button>
          ))}
        </div>
        {families.length === 0 && (
          <div className="empty">No families yet. Whoever set up the co-op can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
