"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { RoomMemberInviteField } from "@/components/RoomMemberInviteField";
import { buildInviteeSlots, buildOrganizerMember } from "@/lib/roomMemberInvites";
import { CURRENCY_OPTIONS, WEEKDAY_OPTIONS } from "@/templates/choreboard/lib/format";
import { seedChores } from "@/templates/choreboard/lib/seed";
import { CHOREBOARD_TEMPLATE_ID } from "@/templates/choreboard/lib/store";
import { MEMBER_COLORS } from "@/templates/choreboard/lib/types";
import { useChoreStore } from "@/templates/choreboard/lib/useChoreStore";

export function Setup() {
  const { roomCode, currentMemberId, setCurrentMember } = useRoomSession();
  const { persona, mutual, sendRoomInvites } = usePersonaContacts();
  const store = useChoreStore();
  const [name, setName] = useState("Our family");
  const [currency, setCurrency] = useState("USD");
  const [payday, setPayday] = useState(0);
  const [invited, setInvited] = useState<typeof mutual>([]);
  const [busy, setBusy] = useState(false);

  const canFinish = !!store && !!persona && !!roomCode && name.trim() && !busy;

  const finish = async () => {
    if (!store || !persona || !roomCode || !canFinish) return;
    setBusy(true);
    try {
      store.initFamily({ name: name.trim(), currency, paydayWeekday: payday });
      const organizer = buildOrganizerMember({
        persona,
        currentMemberId,
        color: MEMBER_COLORS[3],
      });
      const self = store.addMember({
        id: organizer.id,
        name: organizer.name,
        role: "parent",
        color: organizer.color,
      });
      setCurrentMember(self.id);

      const slots = buildInviteeSlots(invited, MEMBER_COLORS);
      for (const slot of slots) {
        store.addMember({
          id: slot.slotId,
          name: slot.name,
          role: "parent",
          color: slot.color,
        });
      }

      if (slots.length > 0) {
        await sendRoomInvites({
          roomCode,
          roomName: name.trim(),
          templateId: CHOREBOARD_TEMPLATE_ID,
          invites: slots.map((s) => ({ contact: s.contact, memberSlotId: s.slotId })),
        });
      }

      seedChores(store);
      store.publishAll();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up your family" />
      <div className="app-main">
        <div className="card stack">
          <div className="field">
            <label>Family name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Currency</label>
              <select
                className="select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Payday</label>
              <select
                className="select"
                value={payday}
                onChange={(e) => setPayday(Number(e.target.value))}
              >
                {WEEKDAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="section-title">Invite co-parents</div>
        <div className="card stack">
          {persona && (
            <div className="row gap-sm" style={{ alignItems: "center", fontSize: 14 }}>
              <strong>You:</strong> {persona.displayName}
            </div>
          )}
          <RoomMemberInviteField
            mutual={mutual}
            selected={invited}
            onChange={setInvited}
            minContacts={0}
            hint="Invite other parents from your contacts. Add kids later from family settings with device links."
          />
        </div>

        <p className="muted" style={{ fontSize: 13 }}>
          We&apos;ll add a starter set of chores you can edit later.
        </p>
        <button
          className="btn btn-primary btn-block"
          disabled={!canFinish}
          onClick={() => void finish()}
        >
          {busy ? "Sending invites…" : "Finish setup"}
        </button>
      </div>
    </div>
  );
}
