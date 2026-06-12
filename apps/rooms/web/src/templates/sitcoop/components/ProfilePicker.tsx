"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useSitCoopStore } from "../lib/useSitCoopStore";
import { FAMILY_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useSitCoopStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getCoop()?.name ?? "Babysitting Co-op"}
      subtitle="Which family is this device? Tap your name."
      personLabel="family"
      people={store.listFamilies()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: FAMILY_COLORS,
        onAdd: (p) => store.addFamily({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
