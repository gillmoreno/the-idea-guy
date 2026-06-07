"use client";

import Link from "next/link";
import { useDevice } from "@/shell/DeviceProvider";
import { roomUrl } from "@the-idea-guy/room-kit";
import { getTemplate } from "@/templates/registry";

export default function HomePage() {
  const { mounted, rooms } = useDevice();

  if (!mounted) {
    return (
      <div className="centered">
        <p className="muted">Starting Rooms…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1>Rooms</h1>
      </div>
      <div className="app-main stack">
        <div className="card stack" style={{ textAlign: "center" }}>
          <div className="hero-logo">🏠</div>
          <p className="muted">
            Local-first rooms for small groups. Your data stays on your devices — the relay only
            syncs encrypted blobs.
          </p>
        </div>

        <Link className="btn btn-primary btn-block" href="/create">
          Create a room
        </Link>
        <Link className="btn btn-block" href="/join">
          Join with invite code
        </Link>

        {rooms.length > 0 && (
          <>
            <div className="section-title">Your rooms</div>
            <div className="stack-sm">
              {rooms.map((r) => {
                const t = getTemplate(r.templateId);
                return (
                  <Link key={r.roomCode} className="card row-link" href={roomUrl(r.roomCode)}>
                    <span style={{ fontSize: 28 }}>{t?.emoji ?? "📦"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{r.roomName ?? t?.name ?? "Room"}</strong>
                      <div className="muted" style={{ fontSize: 13, wordBreak: "break-all" }}>
                        {r.roomCode}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
