"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { OBSERVER_COLORS } from "../lib/types";
import { SYMPTOMDIARY_TEMPLATE_ID } from "../lib/store";
import { useSymptomDiaryStore } from "../lib/useSymptomDiaryStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useSymptomDiaryStore();
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!patientName.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initDiary({ patientName: patientName.trim(), notes: notes.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: `${patientName.trim()} · symptom diary`,
        templateId: SYMPTOMDIARY_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: OBSERVER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addObserver(m),
        addInvitee: (m) => store.addObserver(m),
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
    memberLabel: "observers",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the diary" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            The record the doctor always asks for — symptoms, severity, and when. A partner
            can log what they notice too. End-to-end encrypted: health data stays with you.
          </p>
          <div className="field">
            <label>Whose diary is it?</label>
            <input
              className="input"
              placeholder="Gil · Mum"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Standing notes (conditions, meds, doctor — optional)</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="section-title">Invite an observer</div>
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
          {busy ? "Sending invites…" : "Open the diary"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
