"use client";

import { useState } from "react";
import { DEFAULT_RELAY_URL } from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";
import { isRelaySettingsEnabled } from "@/shell/roomFeatures";
import { normalizeRelayUrl } from "@/shell/relayUrl";

/**
 * Standard Rooms settings block — custom sync relay URL.
 * Hidden unless NEXT_PUBLIC_RELAY_SETTINGS_ENABLED=true at build time.
 */
export function RelaySettings() {
  if (!isRelaySettingsEnabled()) return null;

  return <RelaySettingsPanel />;
}

function RelaySettingsPanel() {
  const { relayUrl, vault, setRelayUrlOverride } = useDevice();
  const override = vault.relayUrlOverride ?? null;
  const [draft, setDraft] = useState(override ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setError(null);
    try {
      const normalized = normalizeRelayUrl(draft);
      setRelayUrlOverride(normalized);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid URL");
    }
  };

  const reset = () => {
    setRelayUrlOverride(null);
    setDraft("");
    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <div className="section-title">Sync relay</div>
      <div className="card stack-sm">
        <p className="muted" style={{ fontSize: 13 }}>
          Devices sync through a WebSocket relay. Payloads are encrypted before they leave the
          phone — the relay only sees opaque blobs. Default: <strong>{DEFAULT_RELAY_URL}</strong>.
        </p>
        <div className="field">
          <label>Custom relay URL</label>
          <input
            className="input"
            placeholder={DEFAULT_RELAY_URL}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>
        )}
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Active: <code style={{ fontSize: 11 }}>{relayUrl}</code>
          {override ? " (custom)" : " (default)"}
        </p>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={save}
            disabled={!draft.trim()}
          >
            {saved ? "Saved!" : "Save & reconnect"}
          </button>
          {override && (
            <button className="btn btn-ghost" onClick={reset}>
              Use default
            </button>
          )}
        </div>
      </div>
    </>
  );
}
