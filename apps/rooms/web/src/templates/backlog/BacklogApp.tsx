"use client";

import Link from "next/link";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { BacklogView } from "./components/BacklogView";
import { useBacklogStore } from "./lib/useBacklogStore";

function Loading({ message }: { message: string }) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo emoji-orb lg">💡🗳️</div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function BacklogApp() {
  const {
    mounted,
    roomCode,
    hasAdminAccess,
    isOwner,
    sync,
    relayUrl,
    currentMemberId,
    leave,
    version,
  } = useRoomSession();
  const store = useBacklogStore();
  void version;

  if (!mounted) return <Loading message="Starting Backlog…" />;
  if (!roomCode || !store || !sync.localLoaded) return <Loading message="Loading ideas…" />;

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <div className="centered" style={{ textAlign: "center" }}>
        <div className="hero-logo">🔗</div>
        <h1>Connecting to backlog…</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 360, marginInline: "auto" }}>
          {sync.connected
            ? "Waiting for the organizer to finish setup, then sync."
            : "Trying to reach the sync relay — check Wi‑Fi or relay settings."}
        </p>
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Relay: {sync.connected ? "connected" : "not connected"} ·{" "}
          <span style={{ wordBreak: "break-all" }}>{relayUrl}</span>
        </p>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={leave}>
          Leave room
        </button>
        <Link className="btn btn-block" href="/" style={{ marginTop: 8 }}>
          Home
        </Link>
      </div>
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <BacklogView memberId={currentMemberId} />;
}
