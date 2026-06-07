"use client";

export function SyncBadge({
  connected,
  localLoaded,
}: {
  connected: boolean;
  localLoaded: boolean;
}) {
  const label = connected ? "Synced" : localLoaded ? "Offline" : "Loading";
  return (
    <span className="sync-badge">
      <span className={`dot ${connected ? "on" : "off"}`} />
      {label}
    </span>
  );
}
