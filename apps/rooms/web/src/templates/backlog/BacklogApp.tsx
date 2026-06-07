"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { BacklogView } from "./components/BacklogView";
import { useBacklogStore } from "./lib/useBacklogStore";

export function BacklogApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useBacklogStore();
  void version;

  if (!mounted) return <RoomLoading emoji="💡🗳️" message="Starting Backlog…" />;
  if (!roomCode || !store || !sync.localLoaded) return <RoomLoading emoji="💡🗳️" message="Loading ideas…" />;

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="💡🗳️"
        title="Connecting to backlog…"
        organizerLabel="the organizer"
      />
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <BacklogView memberId={currentMemberId} />;
}
