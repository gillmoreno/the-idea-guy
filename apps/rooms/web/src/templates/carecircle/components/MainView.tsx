"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relativeTime";
import { nextUp } from "@/lib/fairness";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { CARER_COLORS, type Visit } from "../lib/types";
import { useCareCircleStore } from "../lib/useCareCircleStore";
import { Avatar } from "@/components/kit";

type Tab = "visits" | "notes";

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

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useCareCircleStore();
  const [tab, setTab] = useState<Tab>("visits");
  const [visitNote, setVisitNote] = useState("");
  const [visitorId, setVisitorId] = useState(memberId);
  const [noteText, setNoteText] = useState("");

  if (!store) return null;

  const circle = store.getCircle()!;
  const carers = store.listCarers();
  const visits = store.listVisits();
  const notes = store.listNotes();
  const byId = new Map(carers.map((c) => [c.id, c]));
  const next = nextUp(
    carers,
    visits.map((v) => ({ memberId: v.carerId, at: v.at })),
  );
  const lastVisit = visits[0] ?? null;

  const visitsByDay: [string, Visit[]][] = [];
  for (const visit of visits) {
    const label = dayLabel(visit.at);
    const last = visitsByDay[visitsByDay.length - 1];
    if (last && last[0] === label) last[1].push(visit);
    else visitsByDay.push([label, [visit]]);
  }

  const logVisit = () => {
    store.logVisit({ carerId: byId.has(visitorId) ? visitorId : memberId, note: visitNote });
    setVisitNote("");
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    store.addNote({ text: noteText, byId: memberId });
    setNoteText("");
  };

  return (
    <div className="app">
      <TopbarPersona
        title={`${circle.recipientName} · care`}
        subtitle={circle.notes || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "visits"}
          className={tab === "visits" ? "active" : ""}
          onClick={() => setTab("visits")}
        >
          Visits
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "notes"}
          className={tab === "notes" ? "active" : ""}
          onClick={() => setTab("notes")}
        >
          Updates
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "visits" && (
          <>
            <div className="card stack-sm">
              {lastVisit ? (
                <div style={{ fontSize: 14 }}>
                  Last visit: <strong>{byId.get(lastVisit.carerId)?.name ?? "Someone"}</strong>{" "}
                  · {formatRelativeTime(lastVisit.at)}
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 14 }}>
                  No visits logged yet.
                </div>
              )}
              {next && (
                <div className="row gap-sm" style={{ alignItems: "center" }}>
                  <Avatar person={next} />
                  <strong>
                    {next.id === memberId ? "You're up next" : `${next.name} is up next`}
                  </strong>
                </div>
              )}
            </div>

            <div className="card stack-sm">
              <div className="section-title">Log a visit</div>
              <div className="field">
                <label>Who visited</label>
                <select
                  className="select"
                  value={byId.has(visitorId) ? visitorId : memberId}
                  onChange={(e) => setVisitorId(e.target.value)}
                >
                  {carers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id === memberId ? `${c.name} (you)` : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="input"
                placeholder="Optional note — mood, meals, anything to know"
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
              />
              <button className="btn btn-primary btn-block" onClick={logVisit}>
                Visited just now
              </button>
            </div>

            {visitsByDay.map(([label, dayVisits]) => (
              <div key={label} className="stack-sm">
                <div className="section-title">{label}</div>
                {dayVisits.map((visit) => {
                  const carer = byId.get(visit.carerId);
                  return (
                    <div key={visit.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      {carer && <Avatar person={carer} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{carer?.name ?? "Someone"} visited</strong>
                        <div className="meta-line">
                          {timeLabel(visit.at)}
                          {visit.note ? ` · ${visit.note}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {tab === "notes" && (
          <>
            <div className="card stack-sm">
              <div className="section-title">Share an update</div>
              <textarea
                className="input"
                rows={3}
                placeholder="Doctor said… · Picked up the prescription · She'd love more visitors on weekdays"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button
                className="btn btn-primary btn-block"
                disabled={!noteText.trim()}
                onClick={addNote}
              >
                Post update
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="empty">No updates yet — doctor visits, prescriptions, how they're doing.</div>
            ) : (
              <div className="stack-sm">
                {notes.map((note) => {
                  const author = byId.get(note.byId);
                  return (
                    <div key={note.id} className="card stack-sm">
                      <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{note.text}</p>
                      <div className="row gap-sm" style={{ alignItems: "center" }}>
                        {author && <Avatar person={author} />}
                        <span className="muted" style={{ fontSize: 12 }}>
                          {author?.name ?? "Someone"} · {formatRelativeTime(note.at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <div className="stack-sm">
            <div className="section-title">Add family member by name</div>
            <AddPersonByName
              placeholder="Family member's name"
              hint="Add the circle by name — you can log a visit on their behalf, and they claim their name when they join."
              existingNames={carers.map((c) => c.name)}
              colors={CARER_COLORS}
              onAdd={(p) => store.addCarer({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite family"
            hint="Invite siblings and helpers — everyone sees the same visits and updates."
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
            hint="Share the room code so family can join from their phones."
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
