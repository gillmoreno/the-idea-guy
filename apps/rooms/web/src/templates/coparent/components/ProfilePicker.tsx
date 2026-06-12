"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useCoParentStore } from "../lib/useCoParentStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCoParentStore();
  const hub = store?.getHub();
  const parents = store?.listParents() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{hub ? `${hub.kidsLabel} · co-parenting` : "Co-Parenting Hub"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {parents.map((p) => (
            <button key={p.id} className="profile-card" onClick={() => setCurrentMember(p.id)}>
              <Avatar parent={p} large />
              <div>
                <div className="name">{p.name}</div>
              </div>
            </button>
          ))}
        </div>
        {parents.length === 0 && (
          <div className="empty">No co-parents yet. Whoever set up the hub can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
