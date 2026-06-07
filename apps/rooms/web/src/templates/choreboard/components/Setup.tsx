"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useChoreBoard } from "@/shell/RoomSessionProvider";
import { seedChores } from "@/templates/choreboard/lib/seed";
import { CURRENCY_OPTIONS, WEEKDAY_OPTIONS } from "@/templates/choreboard/lib/format";
import { MEMBER_COLORS, Role } from "@/templates/choreboard/lib/types";

interface DraftMember {
  name: string;
  role: Role;
  color: string;
}

export function Setup() {
  const { store } = useChoreBoard();
  const [name, setName] = useState("Our family");
  const [currency, setCurrency] = useState("USD");
  const [payday, setPayday] = useState(0);
  const [members, setMembers] = useState<DraftMember[]>([
    { name: "", role: "parent", color: MEMBER_COLORS[3] },
  ]);

  const addRow = () =>
    setMembers((m) => [
      ...m,
      { name: "", role: "kid", color: MEMBER_COLORS[m.length % MEMBER_COLORS.length] },
    ]);

  const update = (i: number, patch: Partial<DraftMember>) =>
    setMembers((m) => m.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const remove = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));

  const validMembers = members.filter((m) => m.name.trim());
  const canFinish = !!store && name.trim() && validMembers.length > 0;

  const finish = () => {
    if (!store) return;
    store.initFamily({ name: name.trim(), currency, paydayWeekday: payday });
    seedChores(store);
    for (const m of validMembers) {
      store.addMember({ name: m.name.trim(), role: m.role, color: m.color });
    }
    store.publishAll();
  };

  return (
    <div className="app">
      <SetupTopbar title="Set up your family" />
      <div className="app-main">
        <div className="card stack">
          <div className="field">
            <label>Family name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Currency</label>
              <select
                className="select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Payday</label>
              <select
                className="select"
                value={payday}
                onChange={(e) => setPayday(Number(e.target.value))}
              >
                {WEEKDAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="section-title">Family members</div>
        <div className="card stack">
          {members.map((m, i) => (
            <div key={i} className="stack-sm">
              <div className="grid-2">
                <input
                  className="input"
                  placeholder="Name"
                  value={m.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
                <select
                  className="select"
                  value={m.role}
                  onChange={(e) => update(i, { role: e.target.value as Role })}
                >
                  <option value="parent">Parent</option>
                  <option value="kid">Kid</option>
                </select>
              </div>
              <div className="btn-row">
                {MEMBER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => update(i, { color: c })}
                    aria-label="color"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: c,
                      border: m.color === c ? "3px solid #1f2433" : "2px solid #fff",
                      boxShadow: "0 0 0 1px var(--border)",
                    }}
                  />
                ))}
                {members.length > 1 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(i)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className="btn btn-sm" onClick={addRow}>
            + Add member
          </button>
        </div>

        <p className="muted" style={{ fontSize: 13 }}>
          We&apos;ll add a starter set of chores you can edit later.
        </p>
        <button className="btn btn-primary btn-block" disabled={!canFinish} onClick={finish}>
          Finish setup
        </button>
      </div>
    </div>
  );
}
