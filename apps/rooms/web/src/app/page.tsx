"use client";

import Link from "next/link";
import { useState } from "react";
import type { VaultRoom } from "@the-idea-guy/room-kit";
import { isBackgroundRoomSyncEnabled } from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { useBackgroundRoomSync } from "@/shell/useBackgroundRoomSync";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RoomInvitesBanner } from "@/components/RoomInvitesBanner";
import { InstallAppPrompt } from "@/shell/InstallAppPrompt";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { roomUrl } from "@the-idea-guy/room-kit/links";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import { getBuiltinTemplate } from "@/templates/registry";
import { TemplateIcon } from "@/components/TemplateIcon";

function roomLabel(room: VaultRoom): string {
  if (room.roomName) return room.roomName;
  if (room.templateId === DECLARATIVE_TEMPLATE_ID) return "Custom room";
  return getBuiltinTemplate(room.templateId)?.name ?? "Room";
}

export default function HomePage() {
  const { mounted, rooms, removeRoomFromDevice, vault } = useDevice();
  const { persona, pendingIncoming } = usePersonaContacts();
  const { isSyncing } = useBackgroundRoomSync(true);
  const [pendingRemove, setPendingRemove] = useState<VaultRoom | null>(null);
  const [removing, setRemoving] = useState(false);

  const roomsWithUpdates = rooms.filter((r) => r.hasRemoteUpdates).length;
  const backgroundSyncOn = isBackgroundRoomSyncEnabled(vault);

  const confirmRemove = async () => {
    if (!pendingRemove || removing) return;
    setRemoving(true);
    try {
      await removeRoomFromDevice(pendingRemove.roomCode);
      setPendingRemove(null);
    } finally {
      setRemoving(false);
    }
  };

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
        <div className="card stack hero-card" style={{ textAlign: "center" }}>
          <TemplateIcon emoji="🏠" size="lg" />
          <p className="muted">
            Local-first rooms for small groups. Your data stays on your devices — the relay only
            syncs encrypted blobs.
          </p>
        </div>

        {persona && (
          <Link href="/profile" className="card row gap-sm persona-card-link" style={{ alignItems: "center" }}>
            <PersonaAvatar
              displayName={persona.displayName}
              color={persona.color}
              avatar={persona.avatar}
              size="md"
            />
            <div style={{ flex: 1 }}>
              <strong>{persona.displayName}</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                Your profile on this device
              </div>
            </div>
            <span className="btn btn-ghost btn-sm" style={{ pointerEvents: "none" }}>
              Edit
            </span>
          </Link>
        )}

        {persona && (
          <Link className="btn btn-block" href="/contacts">
            Contacts
            {pendingIncoming.length > 0 ? ` (${pendingIncoming.length})` : ""}
          </Link>
        )}

        <Link className="btn btn-primary btn-block" href="/create">
          Create a room
        </Link>
        <Link className="btn btn-block" href="/join">
          Join with invite code
        </Link>

        <RoomInvitesBanner />

        <InstallAppPrompt />

        {rooms.length > 0 && (
          <>
            <div className="section-title row gap-sm" style={{ alignItems: "center" }}>
              <span>Your rooms</span>
              {backgroundSyncOn && isSyncing ? (
                <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                  Checking for updates…
                </span>
              ) : null}
              {!isSyncing && roomsWithUpdates > 0 ? (
                <span className="room-update-pill">{roomsWithUpdates} updated</span>
              ) : null}
            </div>
            <div className="stack-sm">
              {rooms.map((r) => {
                const t =
                  r.templateId === DECLARATIVE_TEMPLATE_ID
                    ? {
                        emoji: "📋",
                        name: r.roomName ?? "Custom room",
                        accent: "#6366f1",
                      }
                    : getBuiltinTemplate(r.templateId);
                return (
                  <div
                    key={r.roomCode}
                    className="card room-card room-card--actions"
                    style={
                      t?.accent
                        ? ({ "--template-accent": t.accent } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <Link className="room-card__link row-link" href={roomUrl(r.roomCode)}>
                      <TemplateIcon emoji={t?.emoji ?? "📦"} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row gap-sm" style={{ alignItems: "center" }}>
                          <strong>{r.roomName ?? t?.name ?? "Room"}</strong>
                          {r.passphraseProtected ? (
                            <span className="room-update-dot" title="Passphrase protected">
                              🔒
                            </span>
                          ) : null}
                          {r.hasRemoteUpdates ? (
                            <span className="room-update-dot" title="Updated since you last opened this room">
                              Updated
                            </span>
                          ) : null}
                        </div>
                        <div className="muted" style={{ fontSize: 13, wordBreak: "break-all" }}>
                          {r.roomCode}
                        </div>
                        <RoomLocalStorage
                          roomCode={r.roomCode}
                          includeAdmin={!!r.adminSecret}
                          className="muted"
                        />
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm room-card__remove"
                      aria-label={`Remove ${roomLabel(r)} from this device`}
                      onClick={() => setPendingRemove(r)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!pendingRemove}
        variant="danger"
        title="Remove from this device?"
        message={
          pendingRemove ? (
            <>
              <strong>{roomLabel(pendingRemove)}</strong> and all encrypted data stored for it on
              this device will be deleted. Other people&apos;s devices and the relay are not
              affected — you can rejoin later with the invite code.
            </>
          ) : (
            ""
          )
        }
        confirmLabel={removing ? "Removing…" : "Remove from device"}
        cancelLabel="Keep"
        onConfirm={() => void confirmRemove()}
        onCancel={() => {
          if (!removing) setPendingRemove(null);
        }}
      />
    </div>
  );
}
