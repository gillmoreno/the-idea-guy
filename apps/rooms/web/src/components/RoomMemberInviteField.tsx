"use client";

import Link from "next/link";
import type { ContactRecord } from "@the-idea-guy/room-kit";
import { contactDisplayName } from "@the-idea-guy/room-kit";
import { PersonaAvatar } from "@/components/PersonaAvatar";

export function RoomMemberInviteField({
  mutual,
  selected,
  onChange,
  minContacts = 1,
  hint,
}: {
  mutual: ContactRecord[];
  selected: ContactRecord[];
  onChange: (contacts: ContactRecord[]) => void;
  /** Minimum invited contacts (not counting you). */
  minContacts?: number;
  hint?: string;
}) {
  const selectedIds = new Set(selected.map((c) => c.personaId));

  const toggle = (contact: ContactRecord) => {
    if (selectedIds.has(contact.personaId)) {
      onChange(selected.filter((c) => c.personaId !== contact.personaId));
    } else {
      onChange([...selected, contact]);
    }
  };

  return (
    <div className="room-invite-field stack-sm">
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        {hint ??
          `Invite mutual contacts — they get a notification when they open Rooms. Pick at least ${minContacts}.`}
      </p>

      {mutual.length === 0 ? (
        <div className="card stack-sm" style={{ background: "var(--surface-2)" }}>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            No connected contacts yet. Add friends on the Contacts screen first — both sides must
            accept before you can invite them to a room.
          </p>
          <Link href="/contacts" className="btn btn-sm btn-block">
            Go to Contacts
          </Link>
        </div>
      ) : (
        <div className="room-invite-field__list" role="listbox" aria-label="Invite contacts">
          {mutual.map((contact) => {
            const on = selectedIds.has(contact.personaId);
            return (
              <button
                key={contact.personaId}
                type="button"
                role="option"
                aria-selected={on}
                className={`room-invite-field__row${on ? " selected" : ""}`}
                onClick={() => toggle(contact)}
              >
                <PersonaAvatar
                  displayName={contactDisplayName(contact)}
                  color="#64748b"
                  avatar={contact.avatar}
                  size="sm"
                />
                <span style={{ flex: 1, textAlign: "left" }}>{contactDisplayName(contact)}</span>
                <span className="room-invite-field__check" aria-hidden>
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          {selected.length} invited — they can accept or decline from their home screen.
        </p>
      )}
    </div>
  );
}
