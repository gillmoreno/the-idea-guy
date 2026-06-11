"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomConnecting } from "@/shell/RoomConnecting";
import { RoomLoading } from "@/shell/RoomLoading";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { LedgerView } from "./components/LedgerView";
import { getBuiltinTemplate } from "../registry";
import { useRoomLedgerStore } from "./lib/useRoomLedgerStore";

const TEMPLATE = getBuiltinTemplate("roomledger");

export function RoomLedgerApp() {
  const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId, version } =
    useRoomSession();
  const store = useRoomLedgerStore();
  void version;

  if (!mounted)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🏠"}
        accent={TEMPLATE?.accent}
        message="Starting Roommate Ledger…"
      />
    );
  if (!roomCode || !store || !sync.localLoaded)
    return (
      <RoomLoading
        emoji={TEMPLATE?.emoji ?? "🏠"}
        accent={TEMPLATE?.accent}
        message="Loading ledger…"
      />
    );

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <RoomConnecting
        emoji="🏠💸"
        title="Connecting to your household…"
        organizerLabel="whoever set up the room"
      />
    );
  }

  if (!currentMemberId || !store.getRoommate(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <LedgerView memberId={currentMemberId} />;
}
