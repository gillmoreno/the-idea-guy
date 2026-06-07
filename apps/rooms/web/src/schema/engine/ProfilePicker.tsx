"use client";

import { useRoomSession } from "@/shell/RoomSessionProvider";
import { useSchemaStore } from "@/schema/useSchemaStore";

export function DeclarativeProfilePicker() {
  const { roomSchema, setCurrentMember } = useRoomSession();
  const store = useSchemaStore();

  if (!store || !roomSchema) return null;

  const members = store.listMembers();

  return (
    <div className="app">
      <div className="topbar">
        <h1>{store.getBoardName() ?? roomSchema.name}</h1>
      </div>
      <div className="app-main stack">
        <div className="section-title">Who are you?</div>
        {members.length === 0 ? (
          <div className="empty">No members yet. The organizer can add them during setup.</div>
        ) : (
          members.map((m) => (
            <button
              key={m.id}
              type="button"
              className="card row-link"
              onClick={() => setCurrentMember(m.id)}
            >
              <span className="avatar" style={{ background: m.color }}>
                {m.name.slice(0, 2).toUpperCase()}
              </span>
              <strong>{m.name}</strong>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
