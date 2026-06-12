"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { ClaimProfile } from "@/shell/ClaimProfile";
import { useTripSplitStore } from "../lib/useTripSplitStore";
import { TRAVELER_COLORS } from "../lib/types";

export function ProfilePicker() {
  const { setCurrentMember } = useRoomSession();
  const store = useTripSplitStore();
  if (!store) return null;

  return (
    <ClaimProfile
      title={store.getTrip()?.name ?? "Trip Split"}
      personLabel="traveler"
      people={store.listTravelers()}
      onClaim={(id) => setCurrentMember(id)}
      addSelf={{
        colors: TRAVELER_COLORS,
        onAdd: (p) => store.addTraveler({ name: p.name, color: p.color }).id,
      }}
    />
  );
}
