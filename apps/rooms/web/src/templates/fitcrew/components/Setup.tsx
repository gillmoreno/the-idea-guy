"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { MEMBER_COLORS } from "../lib/types";
import { FITCREW_TEMPLATE_ID } from "../lib/store";
import { useFitCrewStore } from "../lib/useFitCrewStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useFitCrewStore();
  const [name, setName] = useState("Fit Crew");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initCrew({ name: name.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: FITCREW_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: MEMBER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addMember(m),
        addInvitee: (m) => store.addMember(m),
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
    memberLabel: "crew members",
  });

  return (
    <div className="app">
      <SetupTopbar title="Start your Fit Crew" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            A private workout league for friends — log sessions, chase streaks, and crown weekly
            winners.
          </p>
          <div className="field">
            <label>Crew name</label>
            <input
              className="input"
              placeholder="Saturday Run Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="section-title">Invite crew</div>
          {persona && (
            <div className="row gap-sm" style={{ alignItems: "center", fontSize: 14 }}>
              <strong>You:</strong> {persona.displayName}
            </div>
          )}
          <RoomMemberInviteField
            mutual={mutual}
            selected={invited}
            onChange={setInvited}
            minContacts={1}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={requestFinish}
        >
          {busy ? "Sending invites…" : "Open Fit Crew"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
