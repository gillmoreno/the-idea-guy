"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { OWNER_COLORS } from "../lib/types";
import { CABINCAL_TEMPLATE_ID } from "../lib/store";
import { useCabinCalStore } from "../lib/useCabinCalStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useCabinCalStore();
  const [name, setName] = useState("The cabin");
  const [details, setDetails] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initPlace({ name: name.trim(), details: details.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: CABINCAL_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: OWNER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addOwner(m),
        addInvitee: (m) => store.addOwner(m),
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
    memberLabel: "co-owners",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up your shared place" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            One calendar for the cabin, boat, or caravan you share — claim your dates,
            see clashes instantly, and keep the nights tally fair.
          </p>
          <div className="field">
            <label>Place name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>House notes (key, rules — optional)</label>
            <input
              className="input"
              placeholder="Key in the lockbox · bring your own sheets"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="section-title">Invite co-owners</div>
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
          {busy ? "Sending invites…" : "Open calendar"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
