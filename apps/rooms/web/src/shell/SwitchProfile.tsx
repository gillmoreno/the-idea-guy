"use client";

import { useRoomSession } from "./RoomSessionProvider";

/**
 * Settings row: hand the device to someone else in the room, or recover from
 * tapping the wrong name on the claim screen. Clears the device's claimed
 * member, which sends the app back to the profile picker.
 */
export function SwitchProfile({ currentName }: { currentName?: string }) {
  const { setCurrentMember } = useRoomSession();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-block"
      onClick={() => setCurrentMember(null)}
    >
      Switch profile{currentName ? ` — not ${currentName}?` : ""}
    </button>
  );
}
