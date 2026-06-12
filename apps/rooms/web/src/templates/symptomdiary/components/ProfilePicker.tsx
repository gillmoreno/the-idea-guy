"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Avatar } from "./ui";
import { useSymptomDiaryStore } from "../lib/useSymptomDiaryStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useSymptomDiaryStore();
  const diary = store?.getDiary();
  const observers = store?.listObservers() ?? [];

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{diary ? `${diary.patientName} · symptom diary` : "Symptom Diary"}</h1>
          <div className="sub">Who&apos;s on this device? Tap your name.</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {observers.map((o) => (
            <button key={o.id} className="profile-card" onClick={() => setCurrentMember(o.id)}>
              <Avatar observer={o} large />
              <div>
                <div className="name">{o.name}</div>
              </div>
            </button>
          ))}
        </div>
        {observers.length === 0 && (
          <div className="empty">No observers yet. Whoever set up the diary can add them during setup.</div>
        )}
      </div>
    </div>
  );
}
