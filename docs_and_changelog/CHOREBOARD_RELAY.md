# ChoreBoard relay

**Date:** 2026-06-01

## Default relay URL

Hosted ChoreBoard builds use **`wss://relay.the-idea-guy.com`** (baked in at build time via `NEXT_PUBLIC_RELAY_URL`).

Local dev still uses `ws://localhost:4500` via `make dev`.

## Settings override (self-hosters)

Parents can set a custom relay in **Settings → Sync relay**. The URL is stored in `localStorage` on that device and takes precedence over the build default. All devices in a family should use the **same** relay URL.

Priority:

1. Settings override (`localStorage`)
2. Build default (`NEXT_PUBLIC_RELAY_URL` → `wss://relay.the-idea-guy.com`)

## Hosting the relay (DIY / early production)

The relay is `choreboard/relay/` — a small Go WebSocket server. It cannot run on Cloudflare Pages; host it on a machine you control.

### cloudflared tunnel (recommended to start)

On your server:

```bash
cd choreboard/relay
go build -o bin/relay .
RELAY_ADDR=:4500 RELAY_DATA_DIR=/var/lib/choreboard-relay ./bin/relay
```

In Cloudflare Zero Trust → Tunnels, point **`relay.the-idea-guy.com`** at `http://localhost:4500`.

Health check: `GET /healthz` → `ok`  
WebSocket: `wss://relay.the-idea-guy.com/sync?room=…`

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_ADDR` | `:4500` | Listen address |
| `RELAY_DATA_DIR` | (empty) | Persist encrypted blob log on disk |

## Paid managed sync (later)

Same default URL for hosted users. Subscription gating will live on the **relay** (token on connect), not in picking a different frontend URL.

## Code

- `choreboard/web/src/lib/relayUrl.ts` — default + override helpers
- `choreboard/web/src/components/RelaySettings.tsx` — Settings UI
