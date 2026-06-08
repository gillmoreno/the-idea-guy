"use client";

import { useEffect } from "react";
import { applyPersonaAccent, clearPersonaAccent } from "@/lib/applyPersonaAccent";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";

/** Applies persona accent to global CSS variables (`--primary`, etc.). */
export function PersonaAccentSync() {
  const { persona } = usePersonaContacts();

  useEffect(() => {
    if (persona?.color) applyPersonaAccent(persona.color);
    else clearPersonaAccent();
  }, [persona?.color]);

  return null;
}
