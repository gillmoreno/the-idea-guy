"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { MEMBER_COLORS } from "../lib/types";
import { useBookClubStore } from "../lib/useBookClubStore";

interface DraftMember {
  name: string;
  color: string;
}

export function Setup() {
  const store = useBookClubStore();
  const [name, setName] = useState("Our book club");
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
  const canFinish = !!store && name.trim() && validMembers.length >= 2;

  const finish = () => {
    if (!store) return;
    store.initClub({ name: name.trim() });
    for (const m of validMembers) {
      store.addMember({ name: m.name.trim(), color: m.color });
    }
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up your club" />
      <div className="app-main">
        <div className="card stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Track what you&apos;re reading, queue up next picks, and jot discussion notes before
            meetups.
          </p>
          <div className="field">
            <label>Club name</label>
            <input
              className="input"
              placeholder="Tuesday Night Readers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="section-title">Members</div>
          <p className="muted" style={{ fontSize: 13 }}>
            Add everyone in the group. You need at least two.
          </p>
          {members.map((m, i) => (
            <div key={i} className="row gap-sm" style={{ alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1 }}>
                <label>{i === 0 ? "Name" : `Member ${i + 1}`}</label>
                <input
                  className="input"
                  placeholder="Jordan"
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
            + Add member
          </button>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          disabled={!canFinish}
          onClick={finish}
        >
          Open the club
        </button>
      </div>
    </div>
  );
}
