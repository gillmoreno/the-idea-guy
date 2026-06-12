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
import type { Player } from "../lib/types";
import { computeStandings } from "../lib/types";
import { todayStr } from "../lib/store";
import { useGameNightStore } from "../lib/useGameNightStore";
import { Avatar } from "./ui";

type Tab = "board" | "nights";

function LogNight({
  players,
  memberId,
  onDone,
}: {
  players: Player[];
  memberId: string;
  onDone: () => void;
}) {
  const store = useGameNightStore();
  const [date, setDate] = useState(todayStr());
  const [game, setGame] = useState("");
  const [winners, setWinners] = useState<Set<string>>(new Set());
  const [hostId, setHostId] = useState("");
  const [note, setNote] = useState("");

  const toggleWinner = (id: string) => {
    setWinners((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSave = !!store && !!game.trim() && winners.size > 0;

  const save = () => {
    if (!store || !canSave) return;
    store.addSession({
      date,
      game,
      winnerIds: [...winners],
      hostId: hostId || undefined,
      note,
      createdById: memberId,
    });
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">Log a game night</div>
      <div className="grid-2">
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Game</label>
          <input
            className="input"
            placeholder="Catan, poker, Mario Kart…"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Winner(s)</label>
        <div className="stack-sm">
          {players.map((p) => (
            <label key={p.id} className="row gap-sm" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={winners.has(p.id)}
                onChange={() => toggleWinner(p.id)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Hosted by (optional)</label>
          <select className="select" value={hostId} onChange={(e) => setHostId(e.target.value)}>
            <option value="">—</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Note (optional)</label>
          <input
            className="input"
            placeholder="Comeback of the year"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          Save night
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
  const store = useGameNightStore();
  const [tab, setTab] = useState<Tab>("board");
  const [logging, setLogging] = useState(false);

  if (!store) return null;

  const crew = store.getCrew()!;
  const players = store.listPlayers();
  const sessions = store.listSessions();
  const byId = new Map(players.map((p) => [p.id, p]));
  const standings = computeStandings(players, sessions);
  const nextHost = nextUp(
    players,
    sessions
      .filter((s) => s.hostId)
      .map((s) => ({ memberId: s.hostId!, at: s.createdAt })),
  );

  return (
    <div className="app">
      <TopbarPersona
        title={crew.name}
        subtitle={crew.details || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "board"}
          className={tab === "board" ? "active" : ""}
          onClick={() => setTab("board")}
        >
          Board
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "nights"}
          className={tab === "nights" ? "active" : ""}
          onClick={() => setTab("nights")}
        >
          Nights
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "board" && (
          <>
            {nextHost && sessions.length > 0 && (
              <div className="card row gap-sm" style={{ alignItems: "center" }}>
                <Avatar player={nextHost} />
                <div style={{ flex: 1 }}>
                  <strong>
                    {nextHost.id === memberId ? "You host next" : `${nextHost.name} hosts next`}
                  </strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Fewest hostings so far — keep it fair.
                  </div>
                </div>
              </div>
            )}

            {sessions.length === 0 ? (
              <div className="empty">
                No nights logged yet. Play something, then log it under Nights.
              </div>
            ) : (
              <div className="stack-sm">
                {standings.map((s, i) => (
                  <div key={s.player.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                    <span className="muted" style={{ width: 22, textAlign: "right", fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <Avatar player={s.player} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{s.player.name}</strong>
                      {s.streak >= 2 && (
                        <span className="cadence-pill" style={{ marginLeft: 8 }}>
                          🔥 {s.streak} in a row
                        </span>
                      )}
                    </div>
                    <strong>
                      {s.wins} win{s.wins === 1 ? "" : "s"}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "nights" && (
          <>
            {logging ? (
              <LogNight players={players} memberId={memberId} onDone={() => setLogging(false)} />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setLogging(true)}>
                + Log a game night
              </button>
            )}

            {sessions.length === 0 && !logging ? (
              <div className="empty">No nights yet — log the first one.</div>
            ) : (
              <div className="stack-sm">
                {sessions.map((s) => {
                  const winnerNames = s.winnerIds
                    .map((id) => byId.get(id)?.name)
                    .filter(Boolean)
                    .join(", ");
                  const host = s.hostId ? byId.get(s.hostId) : null;
                  return (
                    <div key={s.id} className="card">
                      <div className="row gap-sm" style={{ alignItems: "baseline" }}>
                        <strong style={{ flex: 1, minWidth: 0 }}>{s.game}</strong>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {formatDate(s.date)}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        🏆 {winnerNames || "—"}
                        {host ? ` · hosted by ${host.name}` : ""}
                        {s.note ? ` · ${s.note}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite players"
            hint="Invite the crew — everyone sees the same board and can log nights."
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
            hint="Share the room code so players can join from their phones."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
