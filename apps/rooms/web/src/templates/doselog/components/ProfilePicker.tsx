"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useDoseLogStore } from "../lib/useDoseLogStore";
import { CARER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useDoseLogStore();
  if (!store) return null;

  const care = store.getCare();

  return (
    <ClaimProfile
      title={care ? `${care.recipientName} · meds` : "Dose Log"}
      personLabel="caregiver"
      people={store.listCarers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: CARER_COLORS,
        onAdd: (p) => store.addCarer({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
