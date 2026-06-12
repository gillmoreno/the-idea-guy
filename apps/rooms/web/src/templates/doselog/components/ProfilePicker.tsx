"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useDoseLogStore } from "../lib/useDoseLogStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useDoseLogStore();
  const care = store?.getCare();
  const carers = store?.listCarers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{care ? `${care.recipientName} · meds` : "Dose Log"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {carers.map((c) => (
            <button key={c.id} className="profile-card" onClick={() => setCurrentMember(c.id)}>
              <Avatar carer={c} large />
              <div>
                <div className="name">{c.name}</div>
              </div>
            </button>
          ))}
        </div>
        {carers.length === 0 && (
          <div className="empty">No caregivers yet. Whoever set up the room can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
