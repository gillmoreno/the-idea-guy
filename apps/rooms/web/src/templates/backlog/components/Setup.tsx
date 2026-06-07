"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { MEMBER_COLORS } from "../lib/types";
import { useBacklogStore } from "../lib/useBacklogStore";

interface DraftMember {
  name: string;
  color: string;
}

export function Setup() {
  const { currentMemberId, setCurrentMember } = useRoomSession();
  const store = useBacklogStore();
  const [name, setName] = useState("Rooms backlog");
  const [members, setMembers] = useState<DraftMember[]>([
    { name: "", color: MEMBER_COLORS[0] },
  ]);

  const addRow = () =>
    setMembers((rows) => [
      ...rows,
      { name: "", color: MEMBER_COLORS[rows.length % MEMBER_COLORS.length] },
    ]);

  const update = (i: number, patch: Partial<DraftMember>) =>
    setMembers((rows) => rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const remove = (i: number) => setMembers((rows) => rows.filter((_, idx) => idx !== i));

  const validMembers = members.filter((m) => m.name.trim());
  const canFinish = !!store && name.trim() && validMembers.length >= 1;

  const finish = () => {
    if (!store || !canFinish) return;
    const first = store.addMember({
      name: validMembers[0].name.trim(),
      color: validMembers[0].color,
      id: currentMemberId ?? undefined,
    });
    store.initBoard({ name: name.trim() }, first.id);
    for (const m of validMembers.slice(1)) {
      store.addMember({ name: m.name.trim(), color: m.color });
    }
    setCurrentMember(first.id);
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up your backlog" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            A shared idea pool — propose templates, vote on what to build next. Same local-first
            sync as every other room.
          </p>
          <div className="field">
            <label>Backlog name</label>
            <input
              className="input"
              placeholder="Rooms ideas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="section-title">Voters</div>
          <p className="muted" style={{ fontSize: 13 }}>
            Who can add ideas and vote? At least one person.
          </p>
          {members.map((m, i) => (
            <div key={i} className="row gap-sm" style={{ alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1 }}>
                <label>{i === 0 ? "Name" : `Member ${i + 1}`}</label>
                <input
                  className="input"
                  placeholder="You"
                  value={m.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Color</label>
                <select
                  className="select"
                  value={m.color}
                  onChange={(e) => update(i, { color: e.target.value })}
                >
                  {MEMBER_COLORS.map((c) => (
                    <option key={c} value={c}>
                      ●
                    </option>
                  ))}
                </select>
              </div>
              {members.length > 1 && (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => remove(i)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost btn-block" type="button" onClick={addRow}>
            + Add voter
          </button>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={finish}
        >
          Open backlog
        </button>
      </div>
    </div>
  );
}
