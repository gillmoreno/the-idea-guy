"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useSupperClubStore } from "../lib/useSupperClubStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useSupperClubStore();
  const club = store?.getClub();
  const members = store?.listMembers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{club?.name ?? "Supper Club"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
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
          <div className="empty">No members yet. Whoever set up the club can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
