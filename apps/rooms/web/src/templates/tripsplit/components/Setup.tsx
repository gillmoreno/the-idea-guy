"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { CURRENCY_OPTIONS } from "@/templates/choreboard/lib/format";
import { TRAVELER_COLORS } from "../lib/types";
import { TRIPSPLIT_TEMPLATE_ID } from "../lib/store";
import { useTripSplitStore } from "../lib/useTripSplitStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useTripSplitStore();
  const [name, setName] = useState("Our trip");
  const [currency, setCurrency] = useState("USD");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish =
    !!store && !!persona && !!roomCode && name.trim() && invited.length >= 1 && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initTrip({ name: name.trim(), currency });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: TRIPSPLIT_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: TRAVELER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addTraveler(m),
        addInvitee: (m) => store.addTraveler(m),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up your trip" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Split expenses with friends — like Splitwise, but your data stays on your devices.
          </p>
          <div className="field">
            <label>Trip name</label>
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

          <div className="section-title">Invite travelers</div>
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
          onClick={() => void finish()}
        >
          {busy ? "Sending invites…" : "Open trip"}
        </button>
      </div>
    </div>
  );
}
