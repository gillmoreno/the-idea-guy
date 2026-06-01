"use client";

import { SyncState } from "@/kit/sync";

export function SyncBadge({ connected, localLoaded }: SyncState) {
  const label = connected ? "Synced" : localLoaded ? "Offline" : "Loading";
  return (
    <span className="sync-badge" title={label}>
      <span className={`dot ${connected ? "on" : "off"}`} />
      {label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="empty">
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600 }}>{title}</div>
      {hint && <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>{hint}</p>}
    </div>
  );
}
