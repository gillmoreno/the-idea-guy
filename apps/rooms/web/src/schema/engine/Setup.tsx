"use client";

import { useState } from "react";
import { SetupTopbar } from "@/shell/SetupTopbar";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { peekPendingSchema, takePendingSchema } from "@/schema/pending";
import { useSchemaStore } from "@/schema/useSchemaStore";

const MEMBER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

interface DraftMember {
  name: string;
  color: string;
}

export function DeclarativeSetup() {
  const { roomCode, roomSchema, currentMemberId, setCurrentMember } = useRoomSession();
  const store = useSchemaStore();
  const pending = roomCode ? peekPendingSchema(roomCode) : null;
  const schema = roomSchema ?? pending;

  const [name, setName] = useState(schema?.name ?? "My room");
  const [members, setMembers] = useState<DraftMember[]>([
    { name: "", color: MEMBER_COLORS[0] },
  ]);

  if (!schema || !store) {
    return (
      <div className="centered">
        <p className="muted">Missing room schema. Go back and create the room again.</p>
      </div>
    );
  }

  const addRow = () =>
    setMembers((rows) => [
      ...rows,
      { name: "", color: MEMBER_COLORS[rows.length % MEMBER_COLORS.length] },
    ]);

  const update = (i: number, patch: Partial<DraftMember>) =>
    setMembers((rows) => rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const remove = (i: number) => setMembers((rows) => rows.filter((_, idx) => idx !== i));

  const validMembers = members.filter((m) => m.name.trim());
  const canFinish = name.trim() && validMembers.length >= 1;

  const finish = () => {
    if (!canFinish || !roomCode) return;
    takePendingSchema(roomCode);
    const first = store.addMember({
      name: validMembers[0].name.trim(),
      color: validMembers[0].color,
      id: currentMemberId ?? undefined,
    });
    store.initRoom({ roomName: name.trim(), schema }, first.id);
    for (const m of validMembers.slice(1)) {
      store.addMember({ name: m.name.trim(), color: m.color });
    }
    setCurrentMember(first.id);
  };

  return (
    <div
      className="app"
      style={
        schema.accent ? ({ "--template-accent": schema.accent } as React.CSSProperties) : undefined
      }
    >
      <SetupTopbar title={`Set up ${schema.name}`} />
      <div className="app-main">
        <div className="card stack">
          <div className="emoji-orb sm">{schema.emoji}</div>
          {schema.description && (
            <p className="muted" style={{ fontSize: 14 }}>
              {schema.description}
            </p>
          )}
          <div className="field">
            <label>Room name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="section-title">Members</div>
          {members.map((m, i) => (
            <div key={i} className="row gap-sm" style={{ alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 1 }}>
                <label>{i === 0 ? "Your name" : `Member ${i + 1}`}</label>
                <input
                  className="input"
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
          Open room
        </button>
      </div>
    </div>
  );
}
