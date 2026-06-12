"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useCarLogStore } from "../lib/useCarLogStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCarLogStore();
  const car = store?.getCar();
  const drivers = store?.listDrivers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{car?.name ?? "Shared Car Log"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {drivers.map((d) => (
            <button key={d.id} className="profile-card" onClick={() => setCurrentMember(d.id)}>
              <Avatar driver={d} large />
              <div>
                <div className="name">{d.name}</div>
              </div>
            </button>
          ))}
        </div>
        {drivers.length === 0 && (
          <div className="empty">No drivers yet. Whoever set up the room can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
