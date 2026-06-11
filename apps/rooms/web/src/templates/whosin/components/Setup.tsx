"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { PLAYER_COLORS } from "../lib/types";
import { WHOSIN_TEMPLATE_ID } from "../lib/store";
import { useWhosInStore } from "../lib/useWhosInStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useWhosInStore();
  const [name, setName] = useState("Sunday football");
  const [details, setDetails] = useState("");
  const [capacity, setCapacity] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const capacityNum = capacity.trim() ? Number(capacity.trim()) : undefined;
  const capacityOk =
    capacityNum === undefined || (Number.isInteger(capacityNum) && capacityNum > 0);

  const canFinish =
    !!store && !!persona && !!roomCode && !!name.trim() && capacityOk && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initEvent({
        name: name.trim(),
        details: details.trim(),
        capacity: capacityNum,
      });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: WHOSIN_TEMPLATE_ID,
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
      <SetupTopbar title="Set up your event" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            The recurring "who&apos;s coming this week?" — football, poker, band practice.
            Everyone RSVPs, the headcount is always current.
          </p>
          <div className="field">
            <label>Event name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>When & where (shown to everyone)</label>
            <input
              className="input"
              placeholder="Every Sunday 10:00 · Riverside pitch"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Max spots (optional — extras go on the waitlist)</label>
            <input
              className="input"
              inputMode="numeric"
              placeholder="e.g. 10"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
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
          {busy ? "Sending invites…" : "Open event"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
