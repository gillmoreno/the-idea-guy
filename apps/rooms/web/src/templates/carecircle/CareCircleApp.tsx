"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useCareCircleStore } from "./lib/useCareCircleStore";

const TEMPLATE = getBuiltinTemplate("carecircle");

export function CareCircleApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useCareCircleStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "❤️"}
        accent={TEMPLATE?.accent}
        message="Starting Care Circle…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "❤️"}
        accent={TEMPLATE?.accent}
        message="Loading care circle…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="❤️🏥"
        title="Connecting to the care circle…"
        organizerLabel="whoever set up the circle"
      />
    );
  }

  if (!currentMemberId || !store.getCarer(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
