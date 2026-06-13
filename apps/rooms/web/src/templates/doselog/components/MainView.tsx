"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relativeTime";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { CARER_COLORS, type DoseEvent, type Med } from "../lib/types";
import { useDoseLogStore } from "../lib/useDoseLogStore";
import { Avatar } from "@/components/kit";

type Tab = "meds" | "history";

function withinInterval(med: Med, last: DoseEvent | null): boolean {
  if (!last || !med.minIntervalHours) return false;
  return Date.now() - last.at < med.minIntervalHours * 3_600_000;
}

function dayLabel(at: number): string {
  return new Date(at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function AddMed({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const store = useDoseLogStore();
  const [name, setName] = useState("");
  const [doseLabel, setDoseLabel] = useState("");
  const [scheduleLabel, setScheduleLabel] = useState("");
  const [interval, setInterval] = useState("");

  const intervalNum = interval.trim() ? Number(interval.trim()) : undefined;
  const intervalOk = intervalNum === undefined || (Number.isFinite(intervalNum) && intervalNum > 0);
  const canSave = !!store && !!name.trim() && intervalOk;

  const save = () => {
    if (!store || !canSave) return;
    store.addMed({
      name,
      doseLabel,
      scheduleLabel,
      minIntervalHours: intervalNum,
      createdById: memberId,
    });
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">Add medication</div>
      <div className="field">
        <label>Name</label>
        <input
          className="input"
          placeholder="Paracetamol syrup"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Dose</label>
          <input
            className="input"
            placeholder="5 ml"
            value={doseLabel}
            onChange={(e) => setDoseLabel(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Schedule</label>
          <input
            className="input"
            placeholder="every 6h as needed"
            value={scheduleLabel}
            onChange={(e) => setScheduleLabel(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Warn if logged again within (hours, optional)</label>
        <input
          className="input"
          inputMode="decimal"
          placeholder="e.g. 6"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
        />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Add medication
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useDoseLogStore();
  const [tab, setTab] = useState<Tab>("meds");
  const [adding, setAdding] = useState(false);

  if (!store) return null;

  const care = store.getCare()!;
  const carers = store.listCarers();
  const meds = store.listMeds();
  const events = store.listEvents();
  const byId = new Map(carers.map((c) => [c.id, c]));

  const eventsByDay: [string, DoseEvent[]][] = [];
  for (const event of events) {
    const label = dayLabel(event.at);
    const last = eventsByDay[eventsByDay.length - 1];
    if (last && last[0] === label) last[1].push(event);
    else eventsByDay.push([label, [event]]);
  }

  return (
    <div className="app">
      <TopbarPersona
        title={`${care.recipientName} · meds`}
        subtitle={care.notes || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "meds"}
          className={tab === "meds" ? "active" : ""}
          onClick={() => setTab("meds")}
        >
          Meds
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "meds" && (
          <>
            {adding ? (
              <AddMed memberId={memberId} onDone={() => setAdding(false)} />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
                + Add medication
              </button>
            )}

            {meds.length === 0 && !adding ? (
              <div className="empty">
                No medications yet. Add one — then logging a dose is a single tap.
              </div>
            ) : (
              meds.map((med) => {
                const last = store.lastEventForMed(med.id);
                const lastBy = last ? byId.get(last.byId) : null;
                const recent = withinInterval(med, last);
                return (
                  <div
                    key={med.id}
                    className="card stack-sm"
                    style={recent ? { borderColor: "var(--danger, #dc2626)" } : undefined}
                  >
                    <div className="row gap-sm" style={{ alignItems: "baseline" }}>
                      <strong style={{ flex: 1, minWidth: 0 }}>{med.name}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {[med.doseLabel, med.scheduleLabel].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className="row gap-sm" style={{ alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                        {last ? (
                          <>
                            {recent && <span aria-hidden>⚠️ </span>}
                            Last given <strong>{formatRelativeTime(last.at)}</strong>
                            {lastBy ? ` by ${lastBy.name}` : ""}
                            {recent && med.minIntervalHours ? (
                              <span className="muted"> — under the {med.minIntervalHours}h gap</span>
                            ) : null}
                          </>
                        ) : (
                          <span className="muted">Never given yet</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => store.logDose({ med, byId: memberId })}
                      >
                        Log dose now
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {events.length === 0 ? (
              <div className="empty">No doses logged yet.</div>
            ) : (
              eventsByDay.map(([label, dayEvents]) => (
                <div key={label} className="stack-sm">
                  <div className="section-title">{label}</div>
                  {dayEvents.map((event) => {
                    const carer = byId.get(event.byId);
                    return (
                      <div key={event.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                        {carer && <Avatar person={carer} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{event.medName}</strong>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {timeLabel(event.at)} · {carer?.name ?? "Someone"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add caregiver by name</div>
            <AddPersonByName
              placeholder="Caregiver's name"
              hint="Add caregivers by name — they can claim it when they join."
              existingNames={carers.map((c) => c.name)}
              colors={CARER_COLORS}
              onAdd={(p) => store.addCarer({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite caregivers"
            hint="Invite the other parent, grandparents, the sitter — everyone logs into the same record."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addCarer({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so caregivers can join from their phones."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <SwitchProfile currentName={byId.get(memberId)?.name} />
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
