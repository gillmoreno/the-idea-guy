"use client";

import { Avatar, EmptyState } from "@/components/kit";
import { AddPersonByName } from "./AddPersonByName";

export interface ClaimablePerson {
  id: string;
  name: string;
  color: string;
}

/**
 * Join-time claim screen: the room's named people as tappable profiles, plus
 * an add-yourself path so a room-code joiner is never stuck at the door.
 * Claiming is trust-based by design — the E2E room key is the gate; whoever
 * holds it is already inside the circle, the name is just attribution.
 */
export function ClaimProfile({
  title,
  subtitle = "Who's on this device? Tap your name.",
  people,
  personLabel = "member",
  onClaim,
  addSelf,
}: {
  title: string;
  subtitle?: string;
  people: ClaimablePerson[];
  /** Singular, for copy: "player", "traveler", "co-owner"… */
  personLabel?: string;
  onClaim: (id: string) => void;
  /**
   * Enables "Not in the list? Add yourself". Omit only when self-add is
   * genuinely ambiguous (e.g. role-gated rooms).
   */
  addSelf?: {
    colors: readonly string[];
    /** Create the person in the template store and return the new id — claimed immediately. */
    onAdd: (person: { name: string; color: string }) => string;
  };
}) {
  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{title}</h1>
          <div className="sub">{subtitle}</div>
        </div>
      </div>
      <div className="app-main stack">
        {people.length > 0 ? (
          <div className="profile-grid">
            {people.map((p) => (
              <button key={p.id} className="profile-card" onClick={() => onClaim(p.id)}>
                <Avatar person={p} large />
                <div className="name">{p.name}</div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState>
            {addSelf
              ? "Nobody's been added yet — add yourself below to get started."
              : `No ${personLabel}s yet. Anyone already in the room can add them from settings.`}
          </EmptyState>
        )}

        {addSelf && (
          <div className="card stack-sm">
            <div className="section-title">Not in the list?</div>
            <AddPersonByName
              placeholder="Your name"
              buttonLabel="Join"
              hint={`You'll join as a new ${personLabel} — everyone in the room sees the name.`}
              existingNames={people.map((p) => p.name)}
              colors={addSelf.colors}
              onAdd={(p) => {
                const id = addSelf.onAdd(p);
                if (id) onClaim(id);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
