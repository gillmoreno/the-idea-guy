"use client";

import { formatFrequencyCadence } from "@/templates/choreboard/lib/frequency";
import { ChoreFrequencyLimit, DIFFICULTY_META, Difficulty } from "@/templates/choreboard/lib/types";

export function DiffPill({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`diff-pill diff-${difficulty}`}>{DIFFICULTY_META[difficulty].label}</span>
  );
}

export function CadencePill({ limit }: { limit: ChoreFrequencyLimit | null }) {
  return <span className="cadence-pill">{formatFrequencyCadence(limit)}</span>;
}

export function SyncBadge({ connected, localLoaded }: { connected: boolean; localLoaded: boolean }) {
  const label = connected ? "Synced" : localLoaded ? "Offline" : "Loading";
  return (
    <span className="sync-badge">
      <span className={`dot ${connected ? "on" : "off"}`} />
      {label}
    </span>
  );
}

