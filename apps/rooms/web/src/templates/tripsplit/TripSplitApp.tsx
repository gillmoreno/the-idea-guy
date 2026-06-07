"use client";

import Link from "next/link";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { Setup } from "./components/Setup";
import { ProfilePicker } from "./components/ProfilePicker";
import { TripView } from "./components/TripView";
import { useTripSplitStore } from "./lib/useTripSplitStore";

function Loading({ message }: { message: string }) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo">✈️💸</div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function TripSplitApp() {
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
  const store = useTripSplitStore();
  void version;

  if (!mounted) return <Loading message="Starting Trip Split…" />;
  if (!roomCode || !store || !sync.localLoaded) return <Loading message="Loading your trip…" />;

  if (!store.isInitialized()) {
    if (isOwner && hasAdminAccess) return <Setup />;
    return (
      <div className="centered" style={{ textAlign: "center" }}>
        <div className="hero-logo">🔗</div>
        <h1>Connecting to your trip…</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 360, marginInline: "auto" }}>
          {sync.connected
            ? "Waiting for the trip organizer to finish setup, then sync."
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

  if (!currentMemberId || !store.getTraveler(currentMemberId)) {
    return <ProfilePicker />;
  }

  return <TripView memberId={currentMemberId} />;
}
