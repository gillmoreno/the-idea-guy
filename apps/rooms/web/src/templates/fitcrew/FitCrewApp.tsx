"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { FitCrewView } from "./components/FitCrewView";
import { getBuiltinTemplate } from "../registry";
import { useFitCrewStore } from "./lib/useFitCrewStore";

const TEMPLATE = getBuiltinTemplate("fitcrew");

export function FitCrewApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useFitCrewStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🏃"}
        accent={TEMPLATE?.accent}
        message="Starting Fit Crew…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded) {
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🏃"}
        accent={TEMPLATE?.accent}
        message="Loading your crew…"
      />
    );
  }

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🏃🔥"
        title="Connecting to Fit Crew…"
        organizerLabel="the organizer"
      />
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <FitCrewView memberId={currentMemberId} />;
}
