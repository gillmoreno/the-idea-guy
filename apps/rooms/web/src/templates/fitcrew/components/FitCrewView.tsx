"use client";

import { useState } from "react";
import Link from "next/link";
import { imageValueSrc, parseImageValue } from "@/lib/imageValue";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { ACTIVITY_META } from "../lib/types";
import { useFitCrewStore } from "../lib/useFitCrewStore";
import { AddPrize } from "./AddPrize";
import { LogWorkout } from "./LogWorkout";
import { Avatar } from "./ui";

export function FitCrewView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, version } = useRoomSession();
  const store = useFitCrewStore();
  const [logging, setLogging] = useState(false);
  const [addingPrize, setAddingPrize] = useState(false);
  void version;

  if (!store) return null;

  const crew = store.getCrew()!;
  const members = store.listMembers();
  const me = store.getMember(memberId);
  const byId = new Map(members.map((m) => [m.id, m]));
  const board = store.leaderboard();
  const myStats = store.getMemberStats(memberId);
  const logs = store.listLogs().slice(0, 12);
  const prizes = store.listPrizes();

  return (
    <div className="app">
      <TopbarPersona
        title={crew.name}
        subtitle={me?.name ?? "Athlete"}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <div className="app-main stack">
        <div className="fitcrew-hero card">
          <div className="fitcrew-hero__stat">
            <span className="fitcrew-hero__value">{myStats.currentStreak}</span>
            <span className="fitcrew-hero__label">day streak</span>
          </div>
          <div className="fitcrew-hero__stat">
            <span className="fitcrew-hero__value">{myStats.weeklyCount}</span>
            <span className="fitcrew-hero__label">this week</span>
          </div>
          <div className="fitcrew-hero__stat">
            <span className="fitcrew-hero__value">{myStats.bestStreak}</span>
            <span className="fitcrew-hero__label">best ever</span>
          </div>
        </div>

        {logging ? (
          <LogWorkout memberId={memberId} onDone={() => setLogging(false)} />
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => setLogging(true)}>
            + Log workout
          </button>
        )}

        <div className="card stack-sm">
          <div className="section-title">This week&apos;s board</div>
          {board.map((row, index) => {
            const member = byId.get(row.memberId);
            if (!member) return null;
            return (
              <div key={row.memberId} className="fitcrew-board-row">
                <span className="fitcrew-board-rank">{index === 0 ? "👑" : `#${index + 1}`}</span>
                <Avatar member={member} />
                <div className="fitcrew-board-meta">
                  <strong>{member.name}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {row.weeklyCount} workouts · {row.currentStreak}🔥 streak
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card stack-sm">
          <div className="row gap-sm" style={{ justifyContent: "space-between" }}>
            <div className="section-title" style={{ margin: 0 }}>
              Prizes & stakes
            </div>
            {!addingPrize && (
              <button className="btn btn-ghost btn-sm" onClick={() => setAddingPrize(true)}>
                + Add
              </button>
            )}
          </div>
          {addingPrize && (
            <AddPrize memberId={memberId} onDone={() => setAddingPrize(false)} />
          )}
          {prizes.length === 0 && !addingPrize && (
            <p className="muted" style={{ fontSize: 14 }}>
              No prizes yet — add brunch bets, movie picks, or crown the weekly winner.
            </p>
          )}
          {prizes.map((prize) => {
            const winner = prize.awardedToId ? byId.get(prize.awardedToId) : null;
            return (
              <div key={prize.id} className="fitcrew-prize row gap-sm">
                <span className="emoji-orb sm">{prize.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{prize.title}</strong>
                  {prize.description && (
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                      {prize.description}
                    </p>
                  )}
                  <div className="row gap-sm" style={{ marginTop: 8, flexWrap: "wrap" }}>
                    <select
                      className="select"
                      style={{ flex: 1, minWidth: 140 }}
                      value={prize.awardedToId ?? ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) store.awardPrize(prize.id, id);
                      }}
                    >
                      <option value="">Award to…</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {winner && (
                      <span className="cadence-pill">🏆 {winner.name}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="stack-sm">
          <div className="section-title">Recent activity</div>
          {logs.length === 0 ? (
            <div className="empty">No workouts logged yet. Be the first.</div>
          ) : (
            logs.map((log) => {
              const member = byId.get(log.memberId);
              const meta = ACTIVITY_META[log.activity];
              const proof = log.proofImage ? imageValueSrc(parseImageValue(log.proofImage)) : null;
              return (
                <div key={log.id} className="card stack-sm fitcrew-log">
                  <div className="row gap-sm">
                    {member && <Avatar member={member} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>
                        {meta.emoji} {member?.name ?? "Someone"} — {meta.label}
                      </strong>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {new Date(log.loggedAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {log.minutes ? ` · ${log.minutes} min` : ""}
                      </div>
                      {log.note && (
                        <p style={{ margin: "6px 0 0", fontSize: 14 }}>{log.note}</p>
                      )}
                    </div>
                  </div>
                  {proof && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="fitcrew-log__proof" src={proof} alt="Workout proof" loading="lazy" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomInviteSettings
            title="Invite crew"
            hint="Invite friends — everyone logs workouts on their own phone, same encrypted crew room."
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
            hint="Or share the room code — anyone with the code can join and pick their profile."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave crew
          </button>
        </div>
      </div>
    </div>
  );
}
