"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useTripSplitStore } from "../lib/useTripSplitStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useTripSplitStore();
  const trip = store?.getTrip();
  const travelers = store?.listTravelers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{trip?.name ?? "Trip Split"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {travelers.map((t) => (
            <button key={t.id} className="profile-card" onClick={() => setCurrentMember(t.id)}>
              <Avatar traveler={t} large />
              <div>
                <div className="name">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
        {travelers.length === 0 && (
          <div className="empty">No travelers yet. The trip organizer can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
