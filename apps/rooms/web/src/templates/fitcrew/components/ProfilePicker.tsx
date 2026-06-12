"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { MEMBER_COLORS } from "../lib/types";
import { useFitCrewStore } from "../lib/useFitCrewStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useFitCrewStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getCrew()?.name ?? "Fit Crew"}
      personLabel="crew member"
      people={store.listMembers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: MEMBER_COLORS,
        onAdd: (p) => store.addMember({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
