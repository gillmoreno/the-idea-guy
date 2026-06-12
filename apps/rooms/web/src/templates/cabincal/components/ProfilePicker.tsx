"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useCabinCalStore } from "../lib/useCabinCalStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCabinCalStore();
  const place = store?.getPlace();
  const owners = store?.listOwners() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{place?.name ?? "Cabin Calendar"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {owners.map((o) => (
            <button key={o.id} className="profile-card" onClick={() => setCurrentMember(o.id)}>
              <Avatar owner={o} large />
              <div>
                <div className="name">{o.name}</div>
              </div>
            </button>
          ))}
        </div>
        {owners.length === 0 && (
          <div className="empty">No co-owners yet. Whoever set up the room can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
