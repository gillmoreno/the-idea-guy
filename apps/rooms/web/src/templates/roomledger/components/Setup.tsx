"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { CURRENCY_OPTIONS } from "@/lib/format";
import { ROOMMATE_COLORS } from "../lib/types";
import { ROOMLEDGER_TEMPLATE_ID } from "../lib/store";
import { useRoomLedgerStore } from "../lib/useRoomLedgerStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useRoomLedgerStore();
  const [name, setName] = useState("Our place");
  const [currency, setCurrency] = useState("USD");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initHouse({ name: name.trim(), currency });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: ROOMLEDGER_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: ROOMMATE_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addRoommate(m),
        addInvitee: (m) => store.addRoommate(m),
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
    memberLabel: "roommates",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up your household" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Rent, utilities, groceries — split ongoing costs with your roommates and settle up.
            Your money data stays on your devices.
          </p>
          <div className="field">
            <label>Household name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Currency</label>
            <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="section-title">Invite roommates</div>
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
          {busy ? "Sending invites…" : "Open ledger"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
