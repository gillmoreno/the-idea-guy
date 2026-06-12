"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { CURRENCY_OPTIONS } from "@/templates/choreboard/lib/format";
import { SAVER_COLORS } from "../lib/types";
import { GROUPFUND_TEMPLATE_ID } from "../lib/store";
import { useGroupFundStore } from "../lib/useGroupFundStore";

function parseAmountToCents(raw: string): number {
  const trimmed = raw.trim().replace(/,/g, ".");
  if (!trimmed) return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useGroupFundStore();
  const [name, setName] = useState("Trip fund");
  const [details, setDetails] = useState("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initFund({
        name: name.trim(),
        details: details.trim(),
        targetCents: parseAmountToCents(target),
        currency,
      });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: GROUPFUND_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: SAVER_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addSaver(m),
        addInvitee: (m) => store.addSaver(m),
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
    memberLabel: "savers",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the fund" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Saving toward something together — a trip, a group gift, season tickets.
            Everyone logs what they put in; the bar fills up. Money stays your business:
            end-to-end encrypted.
          </p>
          <div className="field">
            <label>What are you saving for?</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Details (optional)</label>
            <input
              className="input"
              placeholder="Mallorca, June 2027 · pay into Anna's account"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Target (optional)</label>
              <input
                className="input"
                inputMode="decimal"
                placeholder="2000.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
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
          </div>

          <div className="section-title">Invite savers</div>
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
          {busy ? "Sending invites…" : "Open the fund"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
