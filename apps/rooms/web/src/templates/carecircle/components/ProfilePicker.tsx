"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useCareCircleStore } from "../lib/useCareCircleStore";
import { CARER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCareCircleStore();
  if (!store) return null;

  const circle = store.getCircle();
  return (
    <ClaimProfile
      title={circle ? `${circle.recipientName} · care` : "Care Circle"}
      personLabel="family member"
      people={store.listCarers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: CARER_COLORS,
        onAdd: (p) => store.addCarer({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
