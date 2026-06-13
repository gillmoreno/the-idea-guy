"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/templates/choreboard/lib/format";
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
import type { Member } from "../lib/types";
import { MEMBER_COLORS } from "../lib/types";
import { todayStr } from "../lib/store";
import { useSupperClubStore } from "../lib/useSupperClubStore";
import { Avatar } from "@/components/kit";

type Tab = "club" | "dinners";

function LogDinner({
  members,
  memberId,
  onDone,
}: {
  members: Member[];
  memberId: string;
  onDone: () => void;
}) {
  const store = useSupperClubStore();
  const [date, setDate] = useState(todayStr());
  const [hostId, setHostId] = useState(memberId);
  const [theme, setTheme] = useState("");
  const [note, setNote] = useState("");

  const canSave = !!store && !!hostId && !!date;

  const save = () => {
    if (!store || !canSave) return;
    store.logDinner({ date, hostId, theme, note, loggedById: memberId });
    onDone();
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Log a dinner</div>
      <div className="grid-2">
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Hosted by</label>
          <select className="select" value={hostId} onChange={(e) => setHostId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Theme (optional)</label>
          <input
            className="input"
            placeholder="Tapas night"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <input
            className="input"
            placeholder="The flan was legendary"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Save dinner
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
  const store = useSupperClubStore();
  const [tab, setTab] = useState<Tab>("club");
  const [logging, setLogging] = useState(false);
  const [newTheme, setNewTheme] = useState("");

  if (!store) return null;

  const club = store.getClub()!;
  const members = store.listMembers();
  const dinners = store.listDinners();
  const themes = store.listThemes();
  const byId = new Map(members.map((m) => [m.id, m]));
  const nextHost = nextUp(
    members,
    dinners.map((d) => ({ memberId: d.hostId, at: d.createdAt })),
  );

  const addTheme = () => {
    if (!newTheme.trim()) return;
    store.addTheme({ title: newTheme, byId: memberId });
    setNewTheme("");
  };

  return (
    <div className="app">
      <TopbarPersona
        title={club.name}
        subtitle={club.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "club"}
          className={tab === "club" ? "active" : ""}
          onClick={() => setTab("club")}
        >
          Club
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "dinners"}
          className={tab === "dinners" ? "active" : ""}
          onClick={() => setTab("dinners")}
        >
          Dinners
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "club" && (
          <>
            {nextHost && (
              <div className="card row gap-sm" style={{ alignItems: "center" }}>
                <Avatar person={nextHost} />
                <div style={{ flex: 1 }}>
                  <strong>
                    {nextHost.id === memberId ? "You host next" : `${nextHost.name} hosts next`}
                  </strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Fewest dinners hosted — keep the rotation fair.
                  </div>
                </div>
              </div>
            )}

            <div className="card stack-sm">
              <div className="section-title">Theme ideas</div>
              <div className="row gap-sm">
                <input
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="Dumpling marathon · 70s night…"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                />
                <button className="btn btn-primary" disabled={!newTheme.trim()} onClick={addTheme}>
                  Add
                </button>
              </div>
            </div>

            {themes.length === 0 ? (
              <div className="empty">No theme ideas yet — pitch the first one.</div>
            ) : (
              <div className="stack-sm">
                {themes.map((t) => {
                  const author = byId.get(t.byId);
                  const votes = store.themeVoteCount(t.id);
                  const voted = store.hasVotedTheme(t.id, memberId);
                  return (
                    <div key={t.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{t.title}</strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {author?.name ?? "Someone"}&apos;s idea
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm${voted ? " btn-primary" : ""}`}
                        aria-pressed={voted}
                        onClick={() => store.toggleThemeVote(t.id, memberId)}
                      >
                        ♥ {votes}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "dinners" && (
          <>
            {logging ? (
              <LogDinner members={members} memberId={memberId} onDone={() => setLogging(false)} />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setLogging(true)}>
                + Log a dinner
              </button>
            )}

            {dinners.length === 0 && !logging ? (
              <div className="empty">No dinners yet — host the first one and log it here.</div>
            ) : (
              <div className="stack-sm">
                {dinners.map((d) => {
                  const host = byId.get(d.hostId);
                  return (
                    <div key={d.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      {host && <Avatar person={host} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {d.theme ? d.theme : "Dinner"} · {host?.name ?? "?"} hosted
                        </strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {formatDate(d.date)}
                          {d.note ? ` · ${d.note}` : ""}
                        </div>
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
            <div className="section-title">Add member by name</div>
            <AddPersonByName
              placeholder="Member name"
              hint="Add the club by name — hosting rotation works right away; they claim their name when they join."
              existingNames={members.map((m) => m.name)}
              colors={MEMBER_COLORS}
              onAdd={(p) => store.addMember({ name: p.name, color: p.color })}
            />
          </div>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite members"
            hint="Invite the club — everyone votes on themes and sees who hosts next."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addMember({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share the room code so members can join from their phones."
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
