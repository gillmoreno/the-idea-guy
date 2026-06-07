"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { TripView } from "./components/TripView";
import { getBuiltinTemplate } from "../registry";
import { useTripSplitStore } from "./lib/useTripSplitStore";

const TEMPLATE = getBuiltinTemplate("tripsplit");

export function TripSplitApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useTripSplitStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "✈️"}
        accent={TEMPLATE?.accent}
        message="Starting Trip Split…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "✈️"}
        accent={TEMPLATE?.accent}
        message="Loading trip…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="✈️💸"
        title="Connecting to your trip…"
        organizerLabel="the trip organizer"
      />
    );
  }

  if (!currentMemberId || !store.getTraveler(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <TripView memberId={currentMemberId} />;
}
