"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { PLAYER_COLORS } from "../lib/types";
import { SCOREPAD_TEMPLATE_ID } from "../lib/store";
import { useScorePadStore } from "../lib/useScorePadStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useScorePadStore();
  const [name, setName] = useState("Friday cards");
  const [game, setGame] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [namedPlayers, setNamedPlayers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initPad({ name: name.trim(), game: game.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: SCOREPAD_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: PLAYER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addPlayer(m),
        addInvitee: (m) => store.addPlayer(m),
      });
      // Organizer takes color 0, invitees the next ones — offset past both.
      namedPlayers.forEach((playerName, i) =>
        store.addPlayer({
          name: playerName,
          color: PLAYER_COLORS[(1 + invited.length + i) % PLAYER_COLORS.length],
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const { requestFinish, reminderModal } = useSetupFinishWithInviteReminder({
    invitedCount: invited.length + namedPlayers.length,
    suggestedMinContacts: 1,
    canFinish,
    onFinish: finish,
    memberLabel: "players",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the score pad" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            The score sheet that never runs out of paper — one phone can keep score for the
            whole table, round by round.
          </p>
          <div className="field">
            <label>Pad name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>What do you usually play? (optional)</label>
            <input
              className="input"
              placeholder="Canasta · rummy · darts"
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

          <div className="section-title">Or add players by name</div>
          {namedPlayers.length > 0 && (
            <div className="stack-sm">
              {namedPlayers.map((playerName) => (
                <div key={playerName} className="row gap-sm" style={{ alignItems: "center", fontSize: 14 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{playerName}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setNamedPlayers((prev) => prev.filter((n) => n !== playerName))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <AddPersonByName
            placeholder="Player name"
            hint="No app needed — you can score every round from this phone. If they join later, they tap their name to claim it."
            existingNames={[persona?.displayName ?? "", ...namedPlayers]}
            colors={PLAYER_COLORS}
            onAdd={(p) => setNamedPlayers((prev) => [...prev, p.name])}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={requestFinish}
        >
          {busy ? "Sending invites…" : "Open the pad"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
