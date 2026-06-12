"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { PARENT_COLORS } from "../lib/types";
import { COPARENT_TEMPLATE_ID } from "../lib/store";
import { useCoParentStore } from "../lib/useCoParentStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useCoParentStore();
  const [kidsLabel, setKidsLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!kidsLabel.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initHub({ kidsLabel: kidsLabel.trim(), notes: notes.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: `${kidsLabel.trim()} · co-parenting`,
        templateId: COPARENT_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: PARENT_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addParent(m),
        addInvitee: (m) => store.addParent(m),
      });
    } finally {
      setBusy(false);
    }
  };

  const { requestFinish, reminderModal } = useSetupFinishWithInviteReminder({
    invitedCount: invited.length,
    suggestedMinContacts: 1,
    canFinish,
    onFinish: finish,
    memberLabel: "co-parents",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the hub" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Two households, one calm place — who has the kids when, and the updates that
            matter. End-to-end encrypted: your family&apos;s logistics stay between you.
          </p>
          <div className="field">
            <label>The kids</label>
            <input
              className="input"
              placeholder="Emma & Noah"
              value={kidsLabel}
              onChange={(e) => setKidsLabel(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Standing info (school, allergies, doctor — optional)</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="section-title">Invite the other parent</div>
          {persona && (
            <div className="row gap-sm" style={{ alignItems: "center", fontSize: 14 }}>
              <strong>You:</strong> {persona.displayName}
            </div>
          )}
          <RoomMemberInviteField mutual={mutual} selected={invited} onChange={setInvited} minContacts={1} />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={requestFinish}
        >
          {busy ? "Sending invites…" : "Open the hub"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
