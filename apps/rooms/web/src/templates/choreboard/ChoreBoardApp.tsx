"use client";

import { useChoreBoard } from "@/shell/RoomSessionProvider";
import { Setup } from "@/templates/choreboard/components/Setup";
import { ProfilePicker } from "@/templates/choreboard/components/ProfilePicker";
import { KidView } from "@/templates/choreboard/components/KidView";
import { ParentView } from "@/templates/choreboard/components/ParentView";
import { ParentGate } from "@/templates/choreboard/components/ParentGate";
import Link from "next/link";

function Loading({ message }: { message: string }) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo">🧹💰</div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function ChoreBoardApp() {
  const {
    mounted,
    roomCode,
    hasParentAccess,
    isCreator,
    store,
    sync,
    version,
    relayUrl,
    currentMemberId,
    leave,
  } = useChoreBoard();
  void version;

  if (!mounted) return <Loading message="Starting ChoreBoard…" />;
  if (!roomCode || !store || !sync.localLoaded) return <Loading message="Loading your data…" />;

  if (!store.isInitialized()) {
    if (isCreator && hasParentAccess) return <Setup />;
    return (
      <div className="centered" style={{ textAlign: "center" }}>
        <div className="hero-logo">🔗</div>
        <h1>Connecting to your room…</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 360, marginInline: "auto" }}>
          {sync.connected
            ? "Waiting for the room owner to finish first-time setup, then sync."
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

  const me = store.getMember(currentMemberId)!;
  if (me.role === "parent" && !hasParentAccess) {
    return <ParentGate />;
  }

  return me.role === "parent" ? (
    <ParentView memberId={me.id} />
  ) : (
    <KidView memberId={me.id} />
  );
}
