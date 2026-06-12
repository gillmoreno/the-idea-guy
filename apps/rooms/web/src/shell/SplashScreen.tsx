"use client";

import { useEffect, useState } from "react";

const SHOW_MS = 1500;
const FADE_MS = 380;

/**
 * Branded launch splash for the installed app: full indigo screen with the
 * logo tiles popping in, then a fade into the UI. Server-rendered into the
 * static HTML so it covers the boot gap instantly; CSS limits it to
 * standalone display mode, so browser tabs never see it.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const fade = setTimeout(() => setPhase("fade"), SHOW_MS);
    const gone = setTimeout(() => setPhase("gone"), SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`app-splash${phase === "fade" ? " app-splash-out" : ""}`} aria-hidden>
      <svg viewBox="103 103 306 306" width="104" height="104">
        <g fill="#ffffff">
          <rect className="splash-tile" x="113" y="113" width="130" height="130" rx="26" />
          <rect className="splash-tile" x="269" y="113" width="130" height="130" rx="26" />
          <rect className="splash-tile" x="113" y="269" width="130" height="130" rx="26" />
          <path
            className="splash-tile"
            d="M295 399 h-26 v-104 a26 26 0 0 1 26 -26 h78 a26 26 0 0 1 26 26 v104 h-26 v-50 a39 39 0 0 0 -78 0 z"
          />
        </g>
      </svg>
      <div className="splash-name">Rooms</div>
    </div>
  );
}
