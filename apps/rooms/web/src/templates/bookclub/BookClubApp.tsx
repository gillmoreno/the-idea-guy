"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { ClubView } from "./components/ClubView";
import { useBookClubStore } from "./lib/useBookClubStore";

export function BookClubApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useBookClubStore();
  void version;

  if (!mounted) return <RoomLoading emoji="📚☕" message="Starting Book Club…" />;
  if (!roomCode || !store || !sync.localLoaded) return <RoomLoading emoji="📚☕" message="Loading club…" />;

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="📚☕"
        title="Connecting to your club…"
        organizerLabel="the organizer"
      />
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <ClubView memberId={currentMemberId} />;
}
