"use client";

import { formatFrequencyCadence } from "@/templates/choreboard/lib/frequency";
import { ChoreFrequencyLimit, DIFFICULTY_META, Difficulty, Member } from "@/templates/choreboard/lib/types";
import { formatMoney } from "@/templates/choreboard/lib/format";

export function Money({ amount, currency }: { amount: number; currency: string }) {
  const cls = amount < 0 ? "amount-neg" : "amount-pos";
  return <span className={cls}>{formatMoney(amount, currency)}</span>;
}

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

export function Avatar({ member, large }: { member: Member; large?: boolean }) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar ${large ? "lg" : ""}`} style={{ background: member.color }}>
      {initials || "?"}
    </span>
  );
}
