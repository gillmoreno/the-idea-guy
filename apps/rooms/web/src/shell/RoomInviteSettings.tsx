"use client";

import { useState } from "react";
import type { ContactRecord } from "@the-idea-guy/room-kit";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { sendPostSetupRoomInvites } from "@/lib/sendPostSetupRoomInvites";
import type { InviteeSlot } from "@/lib/roomMemberInvites";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomDangerZone } from "@/shell/RoomDangerZone";
import { useRoomSession } from "@/shell/RoomSessionProvider";

/**
 * Standard Rooms settings block — invite mutual contacts to the room.
 * Visible only when the user has unlocked admin access (admin secret).
 */
export function RoomInviteSettings({
  onReserveMembers,
  hint,
  title = "Invite members",
  memberColors,
  minContacts = 1,
}: {
  /** Reserve member slots in the room CRDT before inbox invites are sent. */
  onReserveMembers: (slots: InviteeSlot[]) => void;
  hint?: string;
  title?: string;
  memberColors?: readonly string[];
  minContacts?: number;
}) {
  const { hasAdminAccess } = useRoomSession();
  if (!hasAdminAccess) return null;
  return (
    <>
      <RoomInviteSettingsPanel
        onReserveMembers={onReserveMembers}
        hint={hint}
        title={title}
        memberColors={memberColors}
        minContacts={minContacts}
      />
      <RoomDangerZone />
    </>
  );
}

function RoomInviteSettingsPanel({
  onReserveMembers,
  hint,
  title,
  memberColors,
  minContacts,
}: {
  onReserveMembers: (slots: InviteeSlot[]) => void;
  hint?: string;
  title: string;
  memberColors?: readonly string[];
  minContacts: number;
}) {
  const { roomCode, roomName, roomMeta, templateId } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const [invited, setInvited] = useState<ContactRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedTemplateId = templateId ?? roomMeta?.templateId;
  const resolvedRoomName = roomMeta?.roomName ?? roomName ?? roomCode ?? "Room";
  const canSend =
    !!roomCode &&
    !!resolvedTemplateId &&
    !!persona &&
    invited.length > 0 &&
    !busy;

  const send = async () => {
    if (!canSend || !roomCode || !resolvedTemplateId) return;
    setBusy(true);
    setError(null);
    try {
      const count = await sendPostSetupRoomInvites({
        invited,
        roomCode,
        roomName: resolvedRoomName,
        templateId: resolvedTemplateId,
        colors: memberColors,
        onReserveMembers,
        sendRoomInvites,
      });
      if (count > 0) {
        setInvited([]);
        setSent(true);
        setTimeout(() => setSent(false), 2000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send invites");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="section-title">{title}</div>
      <div className="card stack-sm">
        {persona && (
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Inviting as <strong>{persona.displayName}</strong>. Pick mutual contacts — they
            accept from their home screen.
          </p>
        )}
        <RoomMemberInviteField
          mutual={mutual}
          selected={invited}
          onChange={setInvited}
          minContacts={minContacts}
          hint={
            hint ??
            "Invite mutual contacts — they get a notification when they open Rooms."
          }
        />
        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>
        )}
        <button className="btn btn-primary btn-block" onClick={send} disabled={!canSend}>
          {busy ? "Sending…" : sent ? "Invites sent!" : "Send invites"}
        </button>
      </div>
    </>
  );
}
