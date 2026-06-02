const LS_RELAY_OVERRIDE = "choreboard.relayUrl";

/** Baked in at build time; production fallback is the hosted relay subdomain. */
export const DEFAULT_RELAY_URL =
  process.env.NEXT_PUBLIC_RELAY_URL ?? "wss://relay.the-idea-guy.com";

export function normalizeRelayUrl(raw: string): string {
  let url = raw.trim();
  if (!url) throw new Error("Relay URL is required");
  if (!/^wss?:\/\//i.test(url)) {
    url = `${url.includes("localhost") || url.startsWith("127.") ? "ws" : "wss"}://${url}`;
  }
  return url.replace(/\/+$/, "");
}

export function getRelayUrlOverride(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LS_RELAY_OVERRIDE);
  return v ? normalizeRelayUrl(v) : null;
}

/** Effective relay: self-host override, else build default. */
export function getRelayUrl(): string {
  return getRelayUrlOverride() ?? DEFAULT_RELAY_URL;
}

export function setRelayUrlOverride(url: string | null): void {
  if (typeof window === "undefined") return;
  if (url === null || url.trim() === "") {
    localStorage.removeItem(LS_RELAY_OVERRIDE);
    return;
  }
  localStorage.setItem(LS_RELAY_OVERRIDE, normalizeRelayUrl(url));
}
