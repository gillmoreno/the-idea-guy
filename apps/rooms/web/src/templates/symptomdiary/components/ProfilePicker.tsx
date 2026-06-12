"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { OBSERVER_COLORS } from "../lib/types";
import { useSymptomDiaryStore } from "../lib/useSymptomDiaryStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useSymptomDiaryStore();
  if (!store) return null;

  const diary = store.getDiary();
  return (
    <ClaimProfile
      title={diary ? `${diary.patientName} · symptom diary` : "Symptom Diary"}
      personLabel="observer"
      people={store.listObservers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: OBSERVER_COLORS,
        onAdd: (p) => store.addObserver({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
