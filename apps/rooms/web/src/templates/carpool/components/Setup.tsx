"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { DRIVER_COLORS } from "../lib/types";
import { CARPOOL_TEMPLATE_ID } from "../lib/store";
import { useCarpoolStore } from "../lib/useCarpoolStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useCarpoolStore();
  const [name, setName] = useState("School run");
  const [details, setDetails] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initRota({ name: name.trim(), details: details.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: CARPOOL_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: DRIVER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addDriver(m),
        addInvitee: (m) => store.addDriver(m),
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
    memberLabel: "drivers",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up your rota" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Whose turn to drive? Log each drive with one tap — the rota suggests whoever has
            driven least, so it always evens out, swaps included.
          </p>
          <div className="field">
            <label>Rota name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>When & where (shown to everyone)</label>
            <input
              className="input"
              placeholder="Mon–Fri · leaves 8:15 from the corner"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="section-title">Invite drivers</div>
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
          {busy ? "Sending invites…" : "Open rota"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
