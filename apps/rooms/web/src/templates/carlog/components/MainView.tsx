"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/templates/choreboard/lib/format";
import { formatRelativeTime } from "@/lib/relativeTime";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import type { CarEvent } from "../lib/types";
import { latestOdometer } from "../lib/types";
import { useCarLogStore } from "../lib/useCarLogStore";
import { EmptyState, Avatar, MetaLine } from "@/components/kit";

type Tab = "car" | "log";

const KIND_ICON: Record<string, string> = { fuel: "⛽", service: "🔧", note: "📝" };

function parseAmountToCents(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}

function parseOdometer(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/[,. ]/g, "");
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
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

function LogFuel({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const store = useCarLogStore();
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");

  const amountCents = parseAmountToCents(amount);
  const canSave = !!store && amountCents !== undefined;

  const save = () => {
    if (!store || !canSave) return;
    store.logEvent({
      kind: "fuel",
      byId: memberId,
      amountCents,
      odometer: parseOdometer(odometer),
    });
    onDone();
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">⛽ Log a fill-up</div>
      <div className="grid-2">
        <div className="field">
          <label>Cost</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Odometer (optional)</label>
          <input
            className="input"
            inputMode="numeric"
            placeholder="123456"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
          />
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Save fill-up
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function LogService({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const store = useCarLogStore();
  const [kind, setKind] = useState<"service" | "note">("service");
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");

  const canSave = !!store && !!text.trim();

  const save = () => {
    if (!store || !canSave) return;
    store.logEvent({
      kind,
      byId: memberId,
      text,
      amountCents: parseAmountToCents(amount),
      odometer: parseOdometer(odometer),
    });
    onDone();
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">🔧 Log service / note</div>
      <div className="field">
        <label>What</label>
        <input
          className="input"
          placeholder="Oil change · new wipers · weird rattle at 80"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Type</label>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value as "service" | "note")}>
            <option value="service">Service / repair</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="field">
          <label>Cost (optional)</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Odometer (optional)</label>
        <input
          className="input"
          inputMode="numeric"
          placeholder="123456"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
        />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Save
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
  const store = useCarLogStore();
  const [tab, setTab] = useState<Tab>("car");
  const [form, setForm] = useState<"none" | "fuel" | "service">("none");

  if (!store) return null;

  const car = store.getCar()!;
  const drivers = store.listDrivers();
  const events = store.listEvents();
  const byId = new Map(drivers.map((d) => [d.id, d]));
  const holder = store.getHolder();
  const holderDriver = holder ? byId.get(holder.driverId) : null;
  const odometer = latestOdometer(events);

  const eventsByDay: [string, CarEvent[]][] = [];
  for (const event of events) {
    const label = dayLabel(event.at);
    const last = eventsByDay[eventsByDay.length - 1];
    if (last && last[0] === label) last[1].push(event);
    else eventsByDay.push([label, [event]]);
  }

  return (
    <div className="app">
      <TopbarPersona
        title={car.name}
        subtitle={car.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "car"}
          className={tab === "car" ? "active" : ""}
          onClick={() => setTab("car")}
        >
          Car
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "log"}
          className={tab === "log" ? "active" : ""}
          onClick={() => setTab("log")}
        >
          History
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "car" && (
          <>
            <div className="card stack-sm">
              {holderDriver ? (
                <div className="row gap-sm" style={{ alignItems: "center" }}>
                  <Avatar person={holderDriver} />
                  <div style={{ flex: 1 }}>
                    <strong>
                      {holderDriver.id === memberId ? "You have the car" : `${holderDriver.name} has the car`}
                    </strong>
                    <div className="meta-line">
                      since {formatRelativeTime(holder!.at).replace(" ago", "")} ago
                    </div>
                  </div>
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 14 }}>
                  Nobody has claimed the car yet.
                </div>
              )}
              {odometer !== null && (
                <div className="meta-line">
                  Last odometer reading: <strong>{odometer.toLocaleString()}</strong>
                </div>
              )}
              {holderDriver?.id !== memberId && (
                <button className="btn btn-primary btn-block" onClick={() => store.takeCar(memberId)}>
                  I&apos;ve got the car
                </button>
              )}
            </div>

            {form === "fuel" && <LogFuel memberId={memberId} onDone={() => setForm("none")} />}
            {form === "service" && <LogService memberId={memberId} onDone={() => setForm("none")} />}
            {form === "none" && (
              <div className="row gap-sm">
                <button className="btn btn-block" style={{ flex: 1 }} onClick={() => setForm("fuel")}>
                  ⛽ Fill-up
                </button>
                <button className="btn btn-block" style={{ flex: 1 }} onClick={() => setForm("service")}>
                  🔧 Service / note
                </button>
              </div>
            )}
          </>
        )}

        {tab === "log" && (
          <>
            {events.length === 0 ? (
              <EmptyState>Nothing logged yet — fill-ups and services will show here.</EmptyState>
            ) : (
              eventsByDay.map(([label, dayEvents]) => (
                <div key={label} className="stack-sm">
                  <div className="section-title">{label}</div>
                  {dayEvents.map((event) => {
                    const driver = byId.get(event.byId);
                    const parts: string[] = [timeLabel(event.at)];
                    if (driver) parts.push(driver.name);
                    if (event.odometer !== undefined) parts.push(`odo ${event.odometer.toLocaleString()}`);
                    return (
                      <div key={event.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                        <span aria-hidden>{KIND_ICON[event.kind] ?? "📝"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>
                            {event.kind === "fuel"
                              ? `Fill-up${event.amountCents !== undefined ? ` · ${formatMoney(event.amountCents / 100, car.currency)}` : ""}`
                              : event.text}
                          </strong>
                          <MetaLine
                            items={[
                              ...parts,
                              event.kind !== "fuel" && event.amountCents !== undefined
                                ? formatMoney(event.amountCents / 100, car.currency)
                                : null,
                            ]}
                          />
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
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite drivers"
            hint="Invite the household — everyone sees who has the car and what it's costing."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addDriver({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so drivers can join from their phones."
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
