"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoomSession } from "./RoomSessionProvider";

export function SetupTopbar({ title }: { title: string }) {
  const router = useRouter();
  const { leaveRoom } = useRoomSession();

  const leave = () => {
    leaveRoom();
    router.push("/");
  };

  return (
    <div className="topbar">
      <Link href="/" className="btn btn-ghost btn-sm">
        ← Home
      </Link>
      <h1>{title}</h1>
      <button type="button" className="btn btn-ghost btn-sm" onClick={leave}>
        Leave
      </button>
    </div>
  );
}
