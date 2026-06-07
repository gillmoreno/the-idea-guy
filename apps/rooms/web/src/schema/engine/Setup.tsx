"use client";

import { useState } from "react";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { TemplateIcon } from "@/components/TemplateIcon";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { SETUP_MEMBER_COLORS } from "@/lib/roomMemberInvites";
import { peekPendingSchema, takePendingSchema } from "@/schema/pending";
import { useSchemaStore } from "@/schema/useSchemaStore";

export function DeclarativeSetup() {
  const { roomCode, roomSchema, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useSchemaStore();
  const pending = roomCode ? peekPendingSchema(roomCode) : null;
  const schema = roomSchema ?? pending;

  const [name, setName] = useState(schema?.name ?? "My room");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  if (!schema || !store) {
    return (
      <div className="centered">
        <p className="muted">Missing room schema. Go back and create the room again.</p>
      </div>
    );
  }

  const canFinish = !!persona && !!roomCode && name.trim() && !busy;

  const finish = async () => {
    if (!persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: DECLARATIVE_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: SETUP_MEMBER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        onOrganizerReady: (org) => {
          takePendingSchema(roomCode);
          store.initRoom({ roomName: name.trim(), schema }, org.id);
        },
        addOrganizer: (m) => store.addMember(m),
        addInvitee: (m) => store.addMember(m),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="app"
      style={
        schema.accent ? ({ "--template-accent": schema.accent } as React.CSSProperties) : undefined
      }
    >
      <SetupTopbar title={`Set up ${schema.name}`} />
      <div className="app-main">
        <div className="card stack">
          <TemplateIcon
            emoji={schema.emoji}
            size="sm"
            style={
              schema.accent
                ? ({ "--template-accent": schema.accent } as React.CSSProperties)
                : undefined
            }
          />
          {schema.description && (
            <p className="muted" style={{ fontSize: 14 }}>
              {schema.description}
            </p>
          )}
          <div className="field">
            <label>Room name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="section-title">Invite members</div>
          {persona && (
            <div className="row gap-sm" style={{ alignItems: "center", fontSize: 14 }}>
              <strong>You:</strong> {persona.displayName}
            </div>
          )}
          <RoomMemberInviteField
            mutual={mutual}
            selected={invited}
            onChange={setInvited}
            minContacts={0}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={() => void finish()}
        >
          {busy ? "Sending invites…" : "Open room"}
        </button>
      </div>
    </div>
  );
}
