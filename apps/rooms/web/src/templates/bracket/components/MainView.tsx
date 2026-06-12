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
import { AddPersonByName } from "@/shell/AddPersonByName";
import { PLAYER_COLORS, type Player, type Tournament } from "../lib/types";
import { bracketRounds, champion, roundLabel } from "../lib/bracket";
import { useBracketStore } from "../lib/useBracketStore";
import { Avatar } from "./ui";

type Tab = "bracket" | "history";

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function StartBracket({ players, memberId }: { players: Player[]; memberId: string }) {
  const store = useBracketStore();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(players.map((p) => p.id)),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canStart = !!store && selected.size >= 2;

  const start = () => {
    if (!store || !canStart) return;
    const playerIds = shuffled(players.filter((p) => selected.has(p.id)).map((p) => p.id));
    store.startTournament({ playerIds, startedById: memberId });
  };

  const addByName = (input: { name: string; color: string }) => {
    if (!store) return;
    const player = store.addPlayer(input);
    setSelected((prev) => new Set(prev).add(player.id));
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Start a bracket</div>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Pick who&apos;s playing — seeding is a fresh shuffle every time.
      </p>
      <div className="stack-sm">
        {players.map((p) => (
          <label key={p.id} className="row gap-sm" style={{ cursor: "pointer", alignItems: "center" }}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            <Avatar player={p} />
            <span>{p.name}</span>
          </label>
        ))}
      </div>
      <AddPersonByName
        placeholder="Add player by name"
        hint="No app needed — you can report every result from this phone. If they join later, they tap their name to claim it."
        existingNames={players.map((p) => p.name)}
        colors={PLAYER_COLORS}
        onAdd={addByName}
      />
      <button className="btn btn-primary btn-block" disabled={!canStart} onClick={start}>
        Shuffle & start ({selected.size} player{selected.size === 1 ? "" : "s"})
      </button>
    </div>
  );
}

function BracketView({
  tournament,
  byId,
}: {
  tournament: Tournament;
  byId: Map<string, Player>;
}) {
  const store = useBracketStore();
  if (!store) return null;

  const lookup = store.resultLookup(tournament.id);
  const rounds = bracketRounds(tournament.playerIds, lookup);
  const champ = champion(tournament.playerIds, lookup);
  const champPlayer = champ ? byId.get(champ) : null;

  const playerRow = (
    match: { key: string; winner: string | null; playable: boolean },
    pid: string | null,
  ) => {
    if (!pid) {
      return (
        <div className="muted" style={{ fontSize: 13, padding: "4px 0" }}>
          — bye —
        </div>
      );
    }
    const player = byId.get(pid);
    const isWinner = match.winner === pid;
    const clickable = match.playable || isWinner;
    return (
      <button
        type="button"
        className="row gap-sm"
        style={{
          alignItems: "center",
          background: "none",
          border: "none",
          padding: "4px 0",
          width: "100%",
          textAlign: "left",
          cursor: clickable ? "pointer" : "default",
          opacity: match.winner && !isWinner ? 0.45 : 1,
          fontFamily: "inherit",
          fontSize: 14,
        }}
        onClick={() => {
          if (match.playable) store.reportResult(tournament.id, match.key, pid);
          else if (isWinner) store.reportResult(tournament.id, match.key, null);
        }}
      >
        {player && <Avatar player={player} />}
        <span style={{ flex: 1, minWidth: 0, fontWeight: isWinner ? 700 : 400 }}>
          {player?.name ?? "?"}
        </span>
        {isWinner && <span aria-hidden>🏆</span>}
      </button>
    );
  };

  return (
    <div className="stack">
      {champPlayer && (
        <div className="card stack-sm" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32 }} aria-hidden>
            🏆
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{champPlayer.name} wins!</div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Start a new bracket below for the rematch.
          </p>
        </div>
      )}

      {rounds.map((matches, r) => (
        <div key={r} className="stack-sm">
          <div className="section-title">{roundLabel(r, rounds.length)}</div>
          {matches.filter((m) => m.p1 !== null || m.p2 !== null).map((m) => (
            <div key={m.key} className="card stack-sm">
              {playerRow(m, m.p1)}
              {playerRow(m, m.p2)}
              {m.playable && (
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                  Tap the winner. (Tap again to undo.)
                </p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MainView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess } = useRoomSession();
  const store = useBracketStore();
  const [tab, setTab] = useState<Tab>("bracket");
  const [startingNew, setStartingNew] = useState(false);

  if (!store) return null;

  const arena = store.getArena()!;
  const players = store.listPlayers();
  const byId = new Map(players.map((p) => [p.id, p]));
  const tournaments = store.listTournaments();
  const current = tournaments[0] ?? null;
  const past = tournaments.slice(1);
  const currentChamp = current
    ? champion(current.playerIds, store.resultLookup(current.id))
    : null;

  return (
    <div className="app">
      <TopbarPersona
        title={arena.name}
        subtitle={arena.game || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bracket"}
          className={tab === "bracket" ? "active" : ""}
          onClick={() => setTab("bracket")}
        >
          Bracket
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          Champions
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "bracket" && (
          <>
            {!current || startingNew ? (
              <>
                {!current && (
                  <div className="empty">
                    {players.length < 2
                      ? "A bracket needs at least 2 players — add them by name below. Nobody else needs the app."
                      : "No bracket yet — pick the players and start one."}
                  </div>
                )}
                <StartBracket players={players} memberId={memberId} />
                {startingNew && (
                  <button className="btn btn-ghost btn-block" onClick={() => setStartingNew(false)}>
                    Back to current bracket
                  </button>
                )}
              </>
            ) : (
              <>
                <BracketView tournament={current} byId={byId} />
                {currentChamp && (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => setStartingNew(true)}
                  >
                    + New bracket
                  </button>
                )}
                {!currentChamp && (
                  <button
                    className="btn btn-ghost btn-block"
                    onClick={() => setStartingNew(true)}
                  >
                    Abandon & start over
                  </button>
                )}
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {past.length === 0 && !currentChamp ? (
              <div className="empty">No champions yet — finish a bracket first.</div>
            ) : (
              <div className="stack-sm">
                {tournaments.map((t) => {
                  const champId = champion(t.playerIds, store.resultLookup(t.id));
                  const champPlayer = champId ? byId.get(champId) : null;
                  return (
                    <div key={t.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      <span aria-hidden>🏆</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{champPlayer?.name ?? "Unfinished"}</strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {t.playerIds.length} players · {formatRelativeTime(t.createdAt)}
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
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite players"
            hint="Invite the crew — anyone can report results from their phone."
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
