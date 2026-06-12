"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useGroupFundStore } from "../lib/useGroupFundStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useGroupFundStore();
  const fund = store?.getFund();
  const savers = store?.listSavers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{fund?.name ?? "Group Fund"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {savers.map((s) => (
            <button key={s.id} className="profile-card" onClick={() => setCurrentMember(s.id)}>
              <Avatar saver={s} large />
              <div>
                <div className="name">{s.name}</div>
              </div>
            </button>
          ))}
        </div>
        {savers.length === 0 && (
          <div className="empty">No savers yet. Whoever set up the fund can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
