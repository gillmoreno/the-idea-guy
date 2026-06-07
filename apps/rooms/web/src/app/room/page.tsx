"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoomSessionProvider } from "@/shell/RoomSessionProvider";
import { TemplateApp } from "@/templates/TemplateApp";

function RoomInner() {
  const params = useSearchParams();
  const roomCode = params.get("c")?.trim() || null;

  if (!roomCode) {
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

  return (
    <RoomSessionProvider roomCode={roomCode}>
      <TemplateApp />
    </RoomSessionProvider>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="centered muted">Loading room…</div>}>
      <RoomInner />
    </Suspense>
  );
}
