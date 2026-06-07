"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useBacklogStore } from "../lib/useBacklogStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useBacklogStore();
  const board = store?.getBoard();
  const members = store?.listMembers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{board?.name ?? "Backlog"}</h1>
          <div className="sub">Who&apos;s voting on this device?</div>
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
          <div className="empty">No voters yet. The organizer sets them up first.</div>
        )}
      </div>
    </div>
  );
}
