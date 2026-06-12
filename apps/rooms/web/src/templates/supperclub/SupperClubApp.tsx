"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { MainView } from "./components/MainView";
import { getBuiltinTemplate } from "../registry";
import { useSupperClubStore } from "./lib/useSupperClubStore";

const TEMPLATE = getBuiltinTemplate("supperclub");

export function SupperClubApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useSupperClubStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🍷"}
        accent={TEMPLATE?.accent}
        message="Starting Supper Club…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🍷"}
        accent={TEMPLATE?.accent}
        message="Loading the club…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🍷🍽️"
        title="Connecting to the club…"
        organizerLabel="whoever set up the club"
      />
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <MainView memberId={currentMemberId} />;
}
