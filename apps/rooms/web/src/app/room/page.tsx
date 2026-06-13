"use client";

import { Suspense, useEffect, useState } from "react";
import {
  listVaultRooms,
  loadVault,
  parseRoomCodeFromLocation,
  roomUrl,
} from "@the-idea-guy/room-kit";
import { RoomSessionProvider } from "@/shell/RoomSessionProvider";
import { TemplateApp } from "@/templates/TemplateApp";

function RoomInner() {
  // Start null on both the server and the first client render so hydration matches —
  // the hash is read in the effect below, after mount. The room code lives only in the
  // URL hash (never sent to servers/CDN logs); it is this page's identity, not a
  // one-time secret, so unlike /join we never strip it.
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const resolve = () => {
      const fromHash = parseRoomCodeFromLocation(window.location.search, window.location.hash);
      if (fromHash) {
        setRoomCode(fromHash);
        setResolved(true);
        return;
      }
      // Hash lost — a stray link, a PWA cold start, or a navigation that dropped it.
      // Rather than dead-ending on "Missing room code", recover the most recently
      // opened room and rewrite the hash so refresh/back stay stable. Only a device
      // with no rooms at all falls through to the empty state.
      const recent = listVaultRooms(loadVault())[0];
      if (recent) {
        window.history.replaceState({}, "", roomUrl(recent.roomCode));
        setRoomCode(recent.roomCode);
      }
      setResolved(true);
    };
    resolve();
    // Switching rooms on the same /room route (e.g. an invite banner → another room) is
    // a soft navigation that does NOT remount this component, so the mount-only read
    // above would miss it. Re-resolve on every hashchange to follow it.
    window.addEventListener("hashchange", resolve);
    return () => window.removeEventListener("hashchange", resolve);
  }, []);

  if (roomCode) {
    return (
      <RoomSessionProvider roomCode={roomCode}>
        <TemplateApp />
      </RoomSessionProvider>
    );
  }

  // Until the client has read the hash, show the same loading state as the Suspense
  // fallback — never the error — so a transient empty hash can't flash "Missing room code".
  if (!resolved) {
    return <div className="centered muted">Loading room…</div>;
  }

  return (
    <div className="centered">
      <h1>Missing room code</h1>
      <p className="muted">Open a room from your home screen or use an invite link.</p>
      <a className="btn btn-primary" href="/">
        Home
      </a>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="centered muted">Loading room…</div>}>
      <RoomInner />
    </Suspense>
  );
}
