"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { MEMBER_COLORS } from "../lib/types";
import { BOOKCLUB_TEMPLATE_ID } from "../lib/store";
import { useBookClubStore } from "../lib/useBookClubStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useBookClubStore();
  const [name, setName] = useState("Our book club");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initClub({ name: name.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: BOOKCLUB_TEMPLATE_ID,
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
    memberLabel: "readers",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up your club" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Track what you&apos;re reading, queue up next picks, and jot discussion notes before
            meetups.
          </p>
          <div className="field">
            <label>Club name</label>
            <input
              className="input"
              placeholder="Tuesday Night Readers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
            minContacts={1}
            hint="Invite friends to read together — optional now, or add readers later from settings."
          />
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
