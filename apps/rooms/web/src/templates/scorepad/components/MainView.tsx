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
import type { Game, Player } from "../lib/types";
import { PLAYER_COLORS, gameLeaders, gameTotals } from "../lib/types";
import { useScorePadStore } from "../lib/useScorePadStore";
import { Avatar } from "./ui";

type Tab = "game" | "history";

function StartGame({ players, memberId }: { players: Player[]; memberId: string }) {
  const store = useScorePadStore();
  const [title, setTitle] = useState("");
  const [lowWins, setLowWins] = useState(false);
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

  const addByName = (input: { name: string; color: string }) => {
    if (!store) return;
    const player = store.addPlayer(input);
    setSelected((prev) => new Set(prev).add(player.id));
  };

  const canStart = !!store && selected.size >= 2;

  const start = () => {
    if (!store || !canStart) return;
    store.startGame({
      title,
      playerIds: players.filter((p) => selected.has(p.id)).map((p) => p.id),
      lowWins,
      startedById: memberId,
    });
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Start a game</div>
      <div className="grid-2">
        <div className="field">
          <label>Game (optional)</label>
          <input
            className="input"
            placeholder="Canasta"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Winner has…</label>
          <select
            className="select"
            value={lowWins ? "low" : "high"}
            onChange={(e) => setLowWins(e.target.value === "low")}
          >
            <option value="high">highest total</option>
            <option value="low">lowest total</option>
          </select>
        </div>
      </div>
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
        hint="Nobody else needs the app — score the whole table from this phone."
        existingNames={players.map((p) => p.name)}
        colors={PLAYER_COLORS}
        onAdd={addByName}
      />
      <button className="btn btn-primary btn-block" disabled={!canStart} onClick={start}>
        Start ({selected.size} player{selected.size === 1 ? "" : "s"})
      </button>
      {selected.size < 2 && (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Add at least 2 players — by name is fine, nobody else needs the app.
        </p>
      )}
    </div>
  );
}

function AddRound({
  game,
  byId,
  memberId,
  onDone,
}: {
  game: Game;
  byId: Map<string, Player>;
  memberId: string;
  onDone: () => void;
}) {
  const store = useScorePadStore();
  const [points, setPoints] = useState<Record<string, string>>({});

  const parsed: Record<string, number> = {};
  let valid = true;
  for (const playerId of game.playerIds) {
    const raw = (points[playerId] ?? "").trim();
    if (raw === "") {
      parsed[playerId] = 0;
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n)) valid = false;
    else parsed[playerId] = n;
  }

  const save = () => {
    if (!store || !valid) return;
    store.addRound({ gameId: game.id, points: parsed, byId: memberId });
    setPoints({});
    onDone();
  };

  return (
    <div className="card stack-sm">
      <div className="section-title">Score this round</div>
      {game.playerIds.map((playerId) => {
        const player = byId.get(playerId);
        if (!player) return null;
        return (
          <div key={playerId} className="row gap-sm" style={{ alignItems: "center" }}>
            <Avatar player={player} />
            <span style={{ flex: 1, minWidth: 0 }}>{player.name}</span>
            <input
              className="input"
              style={{ width: 90, textAlign: "right" }}
              inputMode="numeric"
              placeholder="0"
              value={points[playerId] ?? ""}
              onChange={(e) =>
                setPoints((prev) => ({ ...prev, [playerId]: e.target.value }))
              }
            />
          </div>
        );
      })}
      {!valid && (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Whole numbers only (negatives are fine).
        </p>
      )}
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!valid} onClick={save}>
          Save round
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
  const store = useScorePadStore();
  const [tab, setTab] = useState<Tab>("game");
  const [scoring, setScoring] = useState(false);

  if (!store) return null;

  const pad = store.getPad()!;
  const players = store.listPlayers();
  const byId = new Map(players.map((p) => [p.id, p]));
  const current = store.currentGame();
  const games = store.listGames();
  const finished = games.filter((g) => g.endedAt);

  const renderScoreboard = (game: Game) => {
    const rounds = store.listRounds(game.id);
    const totals = gameTotals(game, rounds);
    const leaders = new Set(rounds.length > 0 ? gameLeaders(game, rounds) : []);
    const sorted = [...game.playerIds].sort((a, b) => {
      const diff = (totals.get(a) ?? 0) - (totals.get(b) ?? 0);
      return game.lowWins ? diff : -diff;
    });
    return (
      <div className="stack-sm">
        {sorted.map((playerId, i) => {
          const player = byId.get(playerId);
          if (!player) return null;
          return (
            <div key={playerId} className="card row gap-sm" style={{ alignItems: "center" }}>
              <span className="muted" style={{ width: 22, textAlign: "right", fontWeight: 700 }}>
                {i + 1}
              </span>
              <Avatar player={player} />
              <strong style={{ flex: 1, minWidth: 0 }}>
                {player.name}
                {leaders.has(playerId) && <span aria-hidden> 👑</span>}
              </strong>
              <strong>{totals.get(playerId) ?? 0}</strong>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app">
      <TopbarPersona
        title={pad.name}
        subtitle={pad.game || undefined}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "game"}
          className={tab === "game" ? "active" : ""}
          onClick={() => setTab("game")}
        >
          Game
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
        {tab === "game" && (
          <>
            {!current ? (
              <StartGame players={players} memberId={memberId} />
            ) : (
              <>
                <div className="card-row">
                  <div className="section-title" style={{ margin: 0 }}>
                    {current.title} · round {store.listRounds(current.id).length + 1}
                    {current.lowWins ? " · lowest wins" : ""}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => store.endGame(current.id)}
                  >
                    End game
                  </button>
                </div>

                {renderScoreboard(current)}

                {scoring ? (
                  <AddRound
                    game={current}
                    byId={byId}
                    memberId={memberId}
                    onDone={() => setScoring(false)}
                  />
                ) : (
                  <button className="btn btn-primary btn-block" onClick={() => setScoring(true)}>
                    + Score round {store.listRounds(current.id).length + 1}
                  </button>
                )}

                {store.listRounds(current.id).length === 0 && !scoring && (
                  <div className="empty">
                    No rounds yet — tap &quot;Score round 1&quot; when the first hand is done.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {finished.length === 0 ? (
              <div className="empty">Finished games land here with their champions.</div>
            ) : (
              <div className="stack-sm">
                {finished.map((game) => {
                  const rounds = store.listRounds(game.id);
                  const leaders = gameLeaders(game, rounds)
                    .map((id) => byId.get(id)?.name)
                    .filter(Boolean)
                    .join(" & ");
                  return (
                    <div key={game.id} className="card row gap-sm" style={{ alignItems: "center" }}>
                      <span aria-hidden>👑</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {leaders || "Nobody"} won {game.title}
                        </strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {rounds.length} round{rounds.length === 1 ? "" : "s"} ·{" "}
                          {game.playerIds.length} players ·{" "}
                          {formatRelativeTime(game.endedAt ?? game.startedAt)}
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
            hint="Players can join to see the board live — or just stay names on your pad."
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
            hint="Share the room code so players can watch the scores from their phones."
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
