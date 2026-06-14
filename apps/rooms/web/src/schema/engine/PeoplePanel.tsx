"use client";

import { PersonChip } from "@/components/kit";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { useSchemaStore } from "@/schema/useSchemaStore";

// Same palette the person fields use, so colors are consistent across the room.
const PERSON_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

/**
 * PeoplePanel — first-class people management for every declarative room.
 *
 * Solo-first: anyone in the room can add a *named participant* by name with no
 * invite — they become room data immediately (pickable in person fields, and
 * claimable if they join later). This is the proxy-people model the bespoke
 * templates have in setup, brought to the engine so every ported room gets it.
 * (Inviting actual app users still lives in the admin RoomInviteSettings card.)
 */
export function PeoplePanel() {
  const store = useSchemaStore();
  if (!store) return null;

  const members = store.listMembers();

  return (
    <div className="card stack-sm">
      <div className="section-title">People</div>
      {members.length > 0 && (
        <div className="split-view">
          {members.map((m) => (
            <span className="split-view__item" key={m.id}>
              <PersonChip person={m} />
            </span>
          ))}
        </div>
      )}
      <AddPersonByName
        placeholder="Add someone by name"
        hint="No app needed — they can be picked when logging entries, and they claim their name if they join later."
        existingNames={members.map((m) => m.name)}
        colors={PERSON_COLORS}
        onAdd={(p) => store.addMember({ name: p.name, color: p.color })}
      />
    </div>
  );
}
