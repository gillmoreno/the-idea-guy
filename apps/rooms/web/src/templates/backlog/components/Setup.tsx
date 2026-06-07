"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { MEMBER_COLORS } from "../lib/types";
import { BACKLOG_TEMPLATE_ID } from "../lib/store";
import { useBacklogStore } from "../lib/useBacklogStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useBacklogStore();
  const [name, setName] = useState("Rooms backlog");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: BACKLOG_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: MEMBER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        onOrganizerReady: (org) => store.initBoard({ name: name.trim() }, org.id),
        addOrganizer: (m) => store.addMember(m),
        addInvitee: (m) => store.addMember(m),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up backlog" />
      <div className="app-main">
        <div className="card stack">
          <div className="field">
            <label>Board name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="section-title">Invite voters</div>
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
            hint="Optional — invite contacts who can propose and vote on ideas."
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={() => void finish()}
        >
          {busy ? "Sending invites…" : "Open backlog"}
        </button>
      </div>
    </div>
  );
}
