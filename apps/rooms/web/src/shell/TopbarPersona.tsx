"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";

/**
 * Standard app topbar — persona avatar (image/emoji/initials) links to home (/).
 */
export function TopbarPersona({
  title,
  subtitle,
  trailing,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  const { persona } = usePersonaContacts();

  return (
    <div className="topbar">
      <Link href="/" className="topbar-persona" aria-label="Home">
        {persona ? (
          <PersonaAvatar
            displayName={persona.displayName}
            color={persona.color}
            avatar={persona.avatar}
            size="md"
          />
        ) : (
          <span className="persona-avatar persona-avatar--md" style={{ background: "var(--surface-2)" }}>
            ?
          </span>
        )}
        <div className="topbar-persona__text">
          <h1>{title}</h1>
          {subtitle ? <div className="sub">{subtitle}</div> : null}
        </div>
      </Link>
      {trailing}
    </div>
  );
}
