"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useCarLogStore } from "../lib/useCarLogStore";
import { DRIVER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useCarLogStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getCar()?.name ?? "Shared Car Log"}
      personLabel="driver"
      people={store.listDrivers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: DRIVER_COLORS,
        onAdd: (p) => store.addDriver({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
