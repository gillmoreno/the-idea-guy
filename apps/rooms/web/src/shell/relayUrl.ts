export function normalizeRelayUrl(raw: string): string {
  let url = raw.trim();
  if (!url) throw new Error("Relay URL is required");
  if (!/^wss?:\/\//i.test(url)) {
    url = `${url.includes("localhost") || url.startsWith("127.") ? "ws" : "wss"}://${url}`;
  }
  return url.replace(/\/+$/, "");
}
