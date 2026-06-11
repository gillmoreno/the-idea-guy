"use client";

import { useState } from "react";
import { useRoomSession } from "./RoomSessionProvider";

/** Admin-only delete-room control with a two-step confirm (Slack-style). */
export function RoomDangerZone() {
  const { hasAdminAccess, sync, deleteRoom } = useRoomSession();
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!hasAdminAccess) return null;

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteRoom();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="section-title">Danger zone</div>
      <div className="card stack-sm">
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Deleting the room removes it for <strong>everyone</strong>: members see a
          “room deleted” notice, the relay’s stored copy is replaced with a tombstone,
          and this device’s data is purged. This cannot be undone.
        </p>
        {!arming ? (
          <button
            className="btn btn-block btn-danger"
            type="button"
            disabled={!sync.connected}
            onClick={() => setArming(true)}
          >
            Delete room for everyone
          </button>
        ) : (
          <div className="row gap-sm">
            <button
              className="btn btn-ghost"
              type="button"
              style={{ flex: 1 }}
              disabled={busy}
              onClick={() => setArming(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              style={{ flex: 1 }}
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Yes, delete it"}
            </button>
          </div>
        )}
        {!sync.connected && (
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            Connect to the relay first — other members can only learn the room is gone
            through sync.
          </p>
        )}
      </div>
    </>
  );
}
