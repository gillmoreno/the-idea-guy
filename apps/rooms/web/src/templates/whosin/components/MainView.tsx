"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/templates/choreboard/lib/format";
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
import type { Occurrence, Player, Rsvp, RsvpStatus } from "../lib/types";
import { PLAYER_COLORS } from "../lib/types";
import { todayStr } from "../lib/store";
import { useWhosInStore } from "../lib/useWhosInStore";
import { Avatar } from "@/components/kit";

type Tab = "next" | "history";

function splitRoster(players: Player[], rsvps: Map<string, Rsvp>, capacity?: number) {
  const withRsvp = (status: RsvpStatus) =>
    players
      .filter((p) => rsvps.get(p.id)?.status === status)
      .sort((a, b) => (rsvps.get(a.id)?.at ?? 0) - (rsvps.get(b.id)?.at ?? 0));

  const allIn = withRsvp("in");
  const cap = capacity && capacity > 0 ? capacity : allIn.length;
  return {
    ins: allIn.slice(0, cap),
    waitlist: allIn.slice(cap),
    maybes: withRsvp("maybe"),
    outs: withRsvp("out"),
    noReply: players.filter((p) => !rsvps.has(p.id)),
  };
}

function RosterSection({
  title,
  players,
  rsvps,
}: {
  title: string;
  players: Player[];
  rsvps: Map<string, Rsvp>;
}) {
  if (players.length === 0) return null;
  return (
    <>
      <div className="section-title">{title}</div>
      <div className="stack-sm">
        {players.map((p) => {
          const rsvp = rsvps.get(p.id);
          return (
            <div key={p.id} className="card row gap-sm" style={{ alignItems: "center" }}>
              <Avatar person={p} />
              <strong style={{ flex: 1, minWidth: 0 }}>{p.name}</strong>
              {rsvp && (
                <span className="muted" style={{ fontSize: 12 }}>
                  {formatRelativeTime(rsvp.at)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function AddOccurrence({
  memberId,
  onDone,
  compact,
}: {
  memberId: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const store = useWhosInStore();
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(!compact);

  if (!open) {
    return (
      <button className="btn btn-ghost btn-block" onClick={() => setOpen(true)}>
        + Add another date
      </button>
    );
  }

  const save = () => {
    if (!store || !date) return;
    store.addOccurrence({ date, note, createdById: memberId });
    setNote("");
    if (compact) setOpen(false);
    onDone?.();
  };

  return (
    <div className="card stack">
      <div className="section-title">Add the next date</div>
      <div className="grid-2">
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <input
            className="input"
            placeholder="Bring shin pads"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!date} onClick={save}>
          Add date
        </button>
        {compact && (
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function OccurrencePanel({
  occurrence,
  memberId,
  players,
  capacity,
}: {
  occurrence: Occurrence;
  memberId: string;
  players: Player[];
  capacity?: number;
}) {
  const store = useWhosInStore();
  if (!store) return null;

  const rsvps = store.getRsvps(occurrence.id);
  const { ins, waitlist, maybes, outs, noReply } = splitRoster(players, rsvps, capacity);
  const mine = rsvps.get(memberId)?.status;

  const rsvpBtn = (status: RsvpStatus, label: string) => (
    <button
      type="button"
      className={`btn ${mine === status ? "btn-primary" : ""}`}
      style={{ flex: 1 }}
      aria-pressed={mine === status}
      onClick={() => store.setRsvp(occurrence.id, memberId, status)}
    >
      {label}
    </button>
  );

  return (
    <div className="stack">
      <div className="card stack">
        <div style={{ fontSize: 22, fontWeight: 700 }}>{formatDate(occurrence.date)}</div>
        {occurrence.note && <p className="muted" style={{ margin: 0 }}>{occurrence.note}</p>}
        <div className="muted" style={{ fontSize: 14 }}>
          {ins.length} in{capacity ? ` of ${capacity} spots` : ""}
          {waitlist.length > 0 ? ` · ${waitlist.length} waitlisted` : ""}
          {maybes.length > 0 ? ` · ${maybes.length} maybe` : ""}
        </div>
        <div className="row gap-sm">
          {rsvpBtn("in", "I'm in")}
          {rsvpBtn("maybe", "Maybe")}
          {rsvpBtn("out", "Can't make it")}
        </div>
      </div>

      <RosterSection title={capacity ? `In (${ins.length}/${capacity})` : `In (${ins.length})`} players={ins} rsvps={rsvps} />
      <RosterSection title="Waitlist (first come, first served)" players={waitlist} rsvps={rsvps} />
      <RosterSection title="Maybe" players={maybes} rsvps={rsvps} />
      <RosterSection title="Can't make it" players={outs} rsvps={rsvps} />
      {noReply.length > 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          No reply yet: {noReply.map((p) => p.name).join(", ")}
        </p>
      )}
    </div>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useWhosInStore();
  const [tab, setTab] = useState<Tab>("next");

  if (!store) return null;

  const event = store.getEvent()!;
  const players = store.listPlayers();
  const me = store.getPlayer(memberId);
  const occurrences = store.listOccurrences();
  const today = todayStr();
  const upcoming = occurrences.filter((o) => o.date >= today);
  const current = upcoming[0] ?? null;
  const later = upcoming.slice(1);
  const past = occurrences.filter((o) => o.date < today).reverse();

  return (
    <div className="app">
      <TopbarPersona
        title={event.name}
        subtitle={event.details || me?.name || ""}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "next"}
          className={tab === "next" ? "active" : ""}
          onClick={() => setTab("next")}
        >
          Next up
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
        {tab === "next" && (
          <>
            {current ? (
              <>
                <OccurrencePanel
                  occurrence={current}
                  memberId={memberId}
                  players={players}
                  capacity={event.capacity}
                />
                {later.length > 0 && (
                  <>
                    <div className="section-title">Coming up</div>
                    <div className="stack-sm">
                      {later.map((o) => (
                        <div key={o.id} className="card">
                          <strong>{formatDate(o.date)}</strong>
                          {o.note && (
                            <span className="muted" style={{ fontSize: 13 }}> · {o.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <AddOccurrence memberId={memberId} compact />
              </>
            ) : (
              <>
                <div className="empty">
                  No date planned. Add the next one — everyone gets to RSVP.
                </div>
                <AddOccurrence memberId={memberId} />
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {past.length === 0 ? (
              <div className="empty">No past dates yet.</div>
            ) : (
              <div className="stack-sm">
                {past.map((o) => {
                  const rsvps = store.getRsvps(o.id);
                  const { ins } = splitRoster(players, rsvps, event.capacity);
                  return (
                    <div key={o.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{formatDate(o.date)}</strong>
                        {o.note && (
                          <div className="muted" style={{ fontSize: 13 }}>{o.note}</div>
                        )}
                      </div>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {ins.length} showed up
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add player by name</div>
            <AddPersonByName
              placeholder="Player name"
              hint="They don't have the app yet? Add them by name — they can claim it when they join."
              existingNames={players.map((p) => p.name)}
              colors={PLAYER_COLORS}
              onAdd={(p) => store.addPlayer({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite players"
            hint="Invite contacts to join — they RSVP from their own phones."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addPlayer({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so players can join and RSVP from their phones."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <SwitchProfile currentName={me?.name} />
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
