"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useRoomLedgerStore } from "../lib/useRoomLedgerStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useRoomLedgerStore();
  const house = store?.getHouse();
  const roommates = store?.listRoommates() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{house?.name ?? "Roommate Ledger"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {roommates.map((r) => (
            <button key={r.id} className="profile-card" onClick={() => setCurrentMember(r.id)}>
              <Avatar roommate={r} large />
              <div>
                <div className="name">{r.name}</div>
              </div>
            </button>
          ))}
        </div>
        {roommates.length === 0 && (
          <div className="empty">No roommates yet. Whoever set up the room can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
