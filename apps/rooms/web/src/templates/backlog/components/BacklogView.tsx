"use client";

import { useState } from "react";
import Link from "next/link";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import type { IdeaStatus } from "../lib/types";
import { useBacklogStore } from "../lib/useBacklogStore";
import { AddIdea } from "./AddIdea";
import { Avatar, StatusPill } from "./ui";

const STATUS_OPTIONS: IdeaStatus[] = ["proposed", "building", "shipped", "parked"];

export function BacklogView({ memberId }: { memberId: string }) {
  const { sync, setCurrentMember, leaveRoom, roomCode, isOwner, version } = useRoomSession();
  const store = useBacklogStore();
  const [adding, setAdding] = useState(false);
  void version;

  if (!store) return null;

  const board = store.getBoard()!;
  const members = store.listMembers();
  const me = store.getMember(memberId);
  const byId = new Map(members.map((m) => [m.id, m]));
  const ideas = store.listIdeas();

  return (
    <div className="app">
      <div className="topbar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>{board.name}</h1>
          <div className="sub row gap-sm">
            <span>{me?.name ?? "Voter"}</span>
            <SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrentMember(null)}>
          Switch
        </button>
      </div>

      <div className="app-main stack">
        <div className="card stack-sm">
          <p className="muted" style={{ fontSize: 14 }}>
            Vote on what to build. Top ideas float up. Anyone in the room can propose — you decide
            what ships.
          </p>
        </div>

        {adding ? (
          <AddIdea memberId={memberId} onDone={() => setAdding(false)} />
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
            + Propose idea
          </button>
        )}

        {ideas.length === 0 ? (
          <div className="empty">No ideas yet. Be the first to propose one.</div>
        ) : (
          <div className="stack-sm">
            {ideas.map((idea, index) => {
              const voted = store.hasVoted(idea.id, memberId);
              const votes = store.getVoteCount(idea.id);
              const proposer = byId.get(idea.proposedById);
              return (
                <div key={idea.id} className="card stack-sm idea-card">
                  <div className="row gap-sm">
                    <span className="emoji-orb sm">{idea.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row gap-sm" style={{ flexWrap: "wrap", alignItems: "center" }}>
                        <strong>{idea.title}</strong>
                        {index === 0 && votes > 0 && (
                          <span className="rank-pill">#1</span>
                        )}
                        <StatusPill status={idea.status} />
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45 }}>
                        {idea.description}
                      </p>
                      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                        {proposer ? `by ${proposer.name}` : "community"} · {votes} vote
                        {votes === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-sm">
                    <button
                      className={`btn vote-btn${voted ? " voted" : ""}`}
                      onClick={() => store.toggleVote(idea.id, memberId)}
                    >
                      {voted ? "▲ Voted" : "△ Vote"}
                      <span className="vote-count">{votes}</span>
                    </button>
                    {isOwner && (
                      <select
                        className="select"
                        style={{ flex: 1 }}
                        value={idea.status}
                        onChange={(e) =>
                          store.setStatus(idea.id, e.target.value as IdeaStatus)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomCodeShare
            roomCode={roomCode}
            hint="Share this code for a public-ish idea pool — same encrypted sync, no central database."
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
