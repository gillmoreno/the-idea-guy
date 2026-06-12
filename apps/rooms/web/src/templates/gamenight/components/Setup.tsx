"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { PLAYER_COLORS } from "../lib/types";
import { GAMENIGHT_TEMPLATE_ID } from "../lib/store";
import { useGameNightStore } from "../lib/useGameNightStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useGameNightStore();
  const [name, setName] = useState("Friday game night");
  const [details, setDetails] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initCrew({ name: name.trim(), details: details.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: GAMENIGHT_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: PLAYER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addPlayer(m),
        addInvitee: (m) => store.addPlayer(m),
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
    memberLabel: "players",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up game night" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            The running scoreboard your group chat keeps losing — wins, streaks, and whose
            turn it is to host.
          </p>
          <div className="field">
            <label>Crew name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>House rules (optional, shown to everyone)</label>
            <input
              className="input"
              placeholder="Every other Friday · loser does the dishes"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="section-title">Invite players</div>
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
          {busy ? "Sending invites…" : "Open scoreboard"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
