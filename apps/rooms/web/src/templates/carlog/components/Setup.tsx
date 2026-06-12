"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { CURRENCY_OPTIONS } from "@/templates/choreboard/lib/format";
import { DRIVER_COLORS } from "../lib/types";
import { CARLOG_TEMPLATE_ID } from "../lib/store";
import { useCarLogStore } from "../lib/useCarLogStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useCarLogStore();
  const [name, setName] = useState("The car");
  const [details, setDetails] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initCar({ name: name.trim(), details: details.trim(), currency });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: CARLOG_TEMPLATE_ID,
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
      <SetupTopbar title="Set up the car log" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            One shared car, no mysteries — who has it, who filled the tank, what the
            odometer says, and what the mechanic did.
          </p>
          <div className="field">
            <label>Car name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Plate / parking / quirks (optional)</label>
            <input
              className="input"
              placeholder="AB-123-CD · parks on Elm St · sticky handbrake"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
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
          {busy ? "Sending invites…" : "Open car log"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
