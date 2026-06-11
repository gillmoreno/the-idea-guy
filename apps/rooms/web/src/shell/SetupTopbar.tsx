"use client";

import Link from "next/link";
import { useRoomSession } from "./RoomSessionProvider";

export function SetupTopbar({ title }: { title: string }) {
  const { leaveRoom } = useRoomSession();

  return (
    <div className="topbar">
      <Link href="/" className="btn btn-ghost btn-sm">
        ← Home
      </Link>
      <h1>{title}</h1>
      <button type="button" className="btn btn-ghost btn-sm" onClick={leaveRoom}>
        Leave
      </button>
    </div>
  );
}
