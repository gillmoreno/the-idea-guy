"use client";

import { useState } from "react";
import Link from "next/link";
import { contactDisplayName } from "@the-idea-guy/room-kit";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { QRBlock } from "@/shell/QRBlock";
import { PersonaAvatar } from "@/components/PersonaAvatar";

function statusLabel(status: string): string {
  switch (status) {
    case "mutual":
      return "Connected";
    case "pending_in":
      return "Wants to connect";
    case "pending_out":
      return "Waiting for them";
    case "blocked":
      return "Blocked";
    default:
      return status;
  }
}

export default function ContactsPage() {
  const {
    persona,
    myContactCard,
    pendingIncoming,
    pendingOutgoing,
    mutual,
    blocked,
    addContactByCard,
    acceptContact,
    blockContact,
  } = usePersonaContacts();

  const [paste, setPaste] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const tryAdd = () => {
    const result = addContactByCard(paste);
    if (!result.ok) {
      setAddError(result.error ?? "Could not add");
      return;
    }
    setPaste("");
    setAddError(null);
  };

  if (!persona || !myContactCard) return null;

  return (
    <div className="app">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1>Contacts</h1>
          <div className="sub">
            You: <strong>{persona.displayName}</strong>
          </div>
        </div>
        <Link href="/" className="btn btn-ghost btn-sm">
          Home
        </Link>
      </div>

      <div className="app-main stack">
        <div className="card stack-sm">
          <div className="row gap-sm" style={{ alignItems: "center" }}>
            <PersonaAvatar
              displayName={persona.displayName}
              color={persona.color}
              avatar={persona.avatar}
              size="lg"
            />
            <div>
              <strong>{persona.displayName}</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                Shown to connected friends
              </div>
            </div>
          </div>
          <div className="section-title">Your contact code</div>
          <p className="muted" style={{ fontSize: 13 }}>
            Friends add you with this code or QR. Messages and invites only flow after{" "}
            <strong>both sides accept</strong>. You can block anyone unilaterally.
          </p>
          <QRBlock value={myContactCard} label="Scan to add me" size={160} />
          <div className="code-box" style={{ fontSize: 11, wordBreak: "break-all" }}>
            {myContactCard}
          </div>
          <button
            className="btn btn-block"
            type="button"
            onClick={() => void navigator.clipboard.writeText(myContactCard)}
          >
            Copy contact code
          </button>
        </div>

        <div className="card stack-sm">
          <div className="section-title">Add someone</div>
          <textarea
            className="input"
            rows={3}
            placeholder="Paste their contact code"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          {addError && <p className="image-field__error">{addError}</p>}
          <button className="btn btn-primary btn-block" type="button" onClick={tryAdd}>
            Send connection request
          </button>
          <p className="muted" style={{ fontSize: 12 }}>
            They must add you back (or accept your request) before you can invite them to rooms.
          </p>
        </div>

        {pendingIncoming.length > 0 && (
          <div className="stack-sm">
            <div className="section-title">Requests for you</div>
            {pendingIncoming.map((c) => (
              <div key={c.personaId} className="card row gap-sm contact-row">
                <PersonaAvatar
                  displayName={contactDisplayName(c)}
                  color="#64748b"
                  avatar={c.avatar}
                  size="sm"
                />
                <div style={{ flex: 1 }}>
                  <strong>{contactDisplayName(c)}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {statusLabel(c.status)}
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={() => void acceptContact(c.personaId)}
                >
                  Accept
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => blockContact(c.personaId)}
                >
                  Block
                </button>
              </div>
            ))}
          </div>
        )}

        {pendingOutgoing.length > 0 && (
          <div className="stack-sm">
            <div className="section-title">Waiting on them</div>
            {pendingOutgoing.map((c) => (
              <div key={c.personaId} className="card contact-row">
                <strong>{contactDisplayName(c)}</strong>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {statusLabel(c.status)} — ask them to add your code too
                </div>
              </div>
            ))}
          </div>
        )}

        {mutual.length > 0 && (
          <div className="stack-sm">
            <div className="section-title">Connected</div>
            {mutual.map((c) => (
              <div key={c.personaId} className="card row gap-sm contact-row">
                <PersonaAvatar
                  displayName={contactDisplayName(c)}
                  color="#64748b"
                  avatar={c.avatar}
                  size="sm"
                />
                <div style={{ flex: 1 }}>
                  <strong>{contactDisplayName(c)}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Safe to receive invites & messages
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => blockContact(c.personaId)}
                >
                  Block
                </button>
              </div>
            ))}
          </div>
        )}

        {blocked.length > 0 && (
          <div className="stack-sm">
            <div className="section-title">Blocked</div>
            {blocked.map((c) => (
              <div key={c.personaId} className="card contact-row muted">
                {contactDisplayName(c)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
