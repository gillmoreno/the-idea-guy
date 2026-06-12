"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { CARER_COLORS } from "../lib/types";
import { CARECIRCLE_TEMPLATE_ID } from "../lib/store";
import { useCareCircleStore } from "../lib/useCareCircleStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useCareCircleStore();
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!recipientName.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initCircle({ recipientName: recipientName.trim(), notes: notes.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: `${recipientName.trim()} · care`,
        templateId: CARECIRCLE_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: CARER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addCarer(m),
        addInvitee: (m) => store.addCarer(m),
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
    memberLabel: "family members",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the care circle" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            For siblings and family sharing care of someone — who visited, who&apos;s up next,
            and one place for doctor updates. End-to-end encrypted; their health stays in
            the family.
          </p>
          <div className="field">
            <label>Who are you caring for?</label>
            <input
              className="input"
              placeholder="Mum · Grandpa Joe"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Standing info (doctor, meds, address — optional)</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="section-title">Invite family</div>
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
          {busy ? "Sending invites…" : "Open care circle"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
