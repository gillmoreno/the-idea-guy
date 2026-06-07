/** Relay room namespace for all Rooms meta-app templates. */
export const APP_ID = "rooms";

export const DEFAULT_RELAY_URL =
  process.env.NEXT_PUBLIC_RELAY_URL ?? "wss://relay.the-idea-guy.com";

export const DEFAULT_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://rooms.the-idea-guy.com";
