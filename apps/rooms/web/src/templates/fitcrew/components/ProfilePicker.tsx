"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { useFitCrewStore } from "../lib/useFitCrewStore";
import { Avatar } from "./ui";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useFitCrewStore();
  const crew = store?.getCrew();
  const members = store?.listMembers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{crew?.name ?? "Fit Crew"}</h1>
          <div className="sub">Who&apos;s on this device?</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {members.map((m) => (
            <button key={m.id} className="profile-card" onClick={() => setCurrentMember(m.id)}>
              <Avatar member={m} large />
              <div>
                <div className="name">{m.name}</div>
              </div>
            </button>
          ))}
        </div>
        {members.length === 0 && (
          <div className="empty">No crew yet. The organizer sets everyone up first.</div>
        )}
      </div>
    </div>
  );
}
