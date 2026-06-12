"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useCabinCalStore } from "../lib/useCabinCalStore";
import { OWNER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCabinCalStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getPlace()?.name ?? "Cabin Calendar"}
      personLabel="co-owner"
      people={store.listOwners()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: OWNER_COLORS,
        onAdd: (p) => store.addOwner({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
