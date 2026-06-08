/**
 * Build-time feature flags for Rooms (NEXT_PUBLIC_* — baked in at deploy).
 * Repo operator sets these in .env / CI when building the static export.
 */

/** Custom relay URL block in Settings → Sync relay. Off unless explicitly enabled. */
export function isRelaySettingsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_RELAY_SETTINGS_ENABLED;
  return v === "1" || v === "true";
}
