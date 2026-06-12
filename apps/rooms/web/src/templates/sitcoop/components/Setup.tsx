"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { finishRoomSetupWithInvites } from "@/lib/finishRoomSetup";
import { useSetupFinishWithInviteReminder } from "@/lib/useSetupFinishWithInviteReminder";
import { FAMILY_COLORS } from "../lib/types";
import { SITCOOP_TEMPLATE_ID } from "../lib/store";
import { useSitCoopStore } from "../lib/useSitCoopStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useSitCoopStore();
  const [name, setName] = useState("Elm St sitting co-op");
  const [details, setDetails] = useState("");
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && !!name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initCoop({ name: name.trim(), details: details.trim() });
      await finishRoomSetupWithInvites({
        roomCode,
        roomName: name.trim(),
        templateId: SITCOOP_TEMPLATE_ID,
        persona,
        currentMemberId,
        invited,
        colors: FAMILY_COLORS,
        setCurrentMember,
        sendRoomInvites,
        addOrganizer: (m) => store.addFamily(m),
        addInvitee: (m) => store.addFamily(m),
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
    memberLabel: "families",
  });

  return (
    <div className="app">
      <SetupTopbar title="Set up the co-op" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Trade babysitting instead of paying for it — sit for a family, bank the hours,
            spend them when you need a night out. Balances keep it fair; encryption keeps
            your kids&apos; whereabouts private.
          </p>
          <div className="field">
            <label>Co-op name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Ground rules (optional, shown to everyone)</label>
            <input
              className="input"
              placeholder="Book 3 days ahead · max 2 kids at once"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="section-title">Invite families</div>
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
          {busy ? "Sending invites…" : "Open the co-op"}
        </button>
      </div>
      {reminderModal}
    </div>
  );
}
