"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { MEMBER_COLORS } from "../lib/types";
import { SUPPERCLUB_TEMPLATE_ID } from "../lib/store";
import { useSupperClubStore } from "../lib/useSupperClubStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useSupperClubStore();
  const [name, setName] = useState("Supper club");
  const [details, setDetails] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initClub({ name: name.trim(), details: details.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: SUPPERCLUB_TEMPLATE_ID,
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
    memberLabel: "members",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the club" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            The rotating dinner party — fair hosting, theme ideas everyone votes on, and a
            little history of every dinner you&apos;ve had together.
          </p>
          <div className="field">
            <label>Club name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>House rules (optional, shown to everyone)</label>
            <input
              className="input"
              placeholder="First Saturday monthly · host cooks, guests bring wine"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="section-title">Invite members</div>
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
          {busy ? "Sending invites…" : "Open the club"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
