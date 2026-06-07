"use client";

import Link from "next/link";
import { useRoomSession } from "./RoomSessionProvider";

/** Shown when sync is ready but template id is still unknown. */
export function RoomTypePending() {
  const { sync, relayUrl, leaveRoom, roomCode } = useRoomSession();

  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo emoji-orb lg">🔗</div>
      <h1>Room type not synced yet</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: 380, marginInline: "auto" }}>
        {sync.connected
          ? "This room has not published its template metadata yet. If you just joined, ask the owner to open the room once and finish setup."
          : "Still connecting to the relay — check Wi‑Fi or try again in a moment."}
      </p>
      {roomCode && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8, wordBreak: "break-all" }}>
          {roomCode}
        </p>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Relay: {sync.connected ? "connected" : "not connected"} ·{" "}
        <span style={{ wordBreak: "break-all" }}>{relayUrl}</span>
      </p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={leaveRoom}>
        Leave room
      </button>
      <Link className="btn btn-block" href="/" style={{ marginTop: 8 }}>
        Home
      </Link>
    </div>
  );
}
