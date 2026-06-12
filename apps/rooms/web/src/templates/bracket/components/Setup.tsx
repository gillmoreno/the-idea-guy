"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { PLAYER_COLORS } from "../lib/types";
import { BRACKET_TEMPLATE_ID } from "../lib/store";
import { useBracketStore } from "../lib/useBracketStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useBracketStore();
  const [name, setName] = useState("FIFA night");
  const [game, setGame] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initArena({ name: name.trim(), game: game.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: BRACKET_TEMPLATE_ID,
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
      <SetupTopbar title="Set up the bracket" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Knockout night — seed everyone into a bracket, tap winners, crown a champion.
          </p>
          <div className="field">
            <label>Tournament name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>What are you playing? (optional)</label>
            <input
              className="input"
              placeholder="FIFA · ping-pong · Mario Kart"
              value={game}
              onChange={(e) => setGame(e.target.value)}
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
          {busy ? "Sending invites…" : "Open the arena"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
