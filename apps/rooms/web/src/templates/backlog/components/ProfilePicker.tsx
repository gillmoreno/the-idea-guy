"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { MEMBER_COLORS } from "../lib/types";
import { useBacklogStore } from "../lib/useBacklogStore";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useBacklogStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getBoard()?.name ?? "Backlog"}
      subtitle="Who's voting on this device?"
      personLabel="voter"
      people={store.listMembers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: MEMBER_COLORS,
        onAdd: (p) => store.addMember({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
