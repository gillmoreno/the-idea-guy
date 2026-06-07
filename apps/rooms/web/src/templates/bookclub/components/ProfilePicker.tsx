"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useBookClubStore } from "../lib/useBookClubStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useBookClubStore();
  const club = store?.getClub();
  const members = store?.listMembers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{club?.name ?? "Book Club"}</h1>
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
          <div className="empty">No members yet. The organizer can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
