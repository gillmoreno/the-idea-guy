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

### DNS on the-idea-guy.com (not aigil.dev)

`cloudflared tunnel route dns` uses your **login cert** zone. This machine logged in with **aigil.dev**, so CLI DNS for `relay.the-idea-guy.com` wrongly created `relay.the-idea-guy.com.aigil.dev`.

Fix with **one** of:

1. **API (easiest):** `./scripts/relay-route-dns.sh` (needs `deploy/.env` like Pages deploy)
2. **Second cert:** `./scripts/cloudflared-login-the-idea-guy.sh` then route DNS with `TUNNEL_ORIGIN_CERT` — see [CLOUDFLARED_MULTI_ZONE.md](./CLOUDFLARED_MULTI_ZONE.md)
3. **Dashboard:** Zero Trust → Tunnels → choreboard-relay → Public Hostname `relay.the-idea-guy.com` → `http://localhost:4500`

### cloudflared tunnel (recommended — same flow as aigil.dev)

This Mac already uses **`~/Infrastructure/deployer/deploy.sh`** for `*.aigil.dev` (Docker + cloudflared + launchd). The relay uses the same script with **`DEPLOY_DOMAIN=the-idea-guy.com`**.

**Agent skill:** `.cursor/skills/choreboard-relay-deploy/SKILL.md` — checklist, verify steps, sudo handling.

**One command** (from repo root; needs Docker running, `cloudflared tunnel login` once, and sudo for launchd):

```bash
./scripts/deploy-relay.sh
```

That will:

1. Build and run the relay in Docker on port **4500** (`choreboard/relay/docker-compose.yml`)
2. Create tunnel **`choreboard-relay`** (if missing)
3. Install a launchd service `com.cloudflare.cloudflared.choreboard-relay`
4. Route DNS **`relay.the-idea-guy.com`** → the tunnel

Manual equivalent:

```bash
DEPLOY_DOMAIN=the-idea-guy.com \
  ~/Infrastructure/deployer/deploy.sh deploy choreboard-relay relay 4500 \
  "$(pwd)/choreboard/relay"
```

**Verify** after deploy:

```bash
curl -s https://relay.the-idea-guy.com/healthz   # → ok
```

WebSocket sync: `wss://relay.the-idea-guy.com/sync?room=…` (matches `NEXT_PUBLIC_RELAY_URL` in `deploy/subdomains.json`).

**Without Docker** (native binary on the same machine):

```bash
cd choreboard/relay && go build -o bin/relay .
RELAY_ADDR=:4500 RELAY_DATA_DIR=~/.local/share/choreboard-relay ./bin/relay
```

Then run only the tunnel steps from `deploy.sh` (create tunnel `choreboard-relay`, config hostname `relay.the-idea-guy.com` → `http://localhost:4500`, launchd, `tunnel route dns`). Prefer `./scripts/deploy-relay.sh` so config matches other apps.

Health check: `GET /healthz` → `ok`

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_ADDR` | `:4500` | Listen address |
| `RELAY_DATA_DIR` | (empty) | Persist encrypted blob log on disk |
| `RELAY_EVICT_AFTER` | `30m` | Evict idle, peer-less rooms from RAM (requires `RELAY_DATA_DIR`; `0` = never). Safe: members' devices re-seed evicted rooms with a checkpoint on reconnect |
| `RELAY_EXPIRE_AFTER` | `0` (never) | Delete room files idle longer than this from disk entirely |
| `RELAY_MAX_MSG_BYTES` | `8388608` (8 MiB) | Ceiling per encrypted frame |
| `RELAY_MAX_ROOM_LOG_BYTES` | `67108864` (64 MiB) | Per-room backlog cap; an over-cap writer gets a policy close asking for a checkpoint |
| `RELAY_MAX_CONNS_PER_IP` | `128` | Concurrent WebSockets per client address (`0` = unlimited) |
| `RELAY_ROOM_CREATES_PER_IP_HOUR` | `120` | Brand-new rooms per address per hour, token bucket (`0` = unlimited). Joining existing rooms is never limited |

The relay starts with zero rooms resident and lazy-loads each room's log from disk on first connect, so RAM scales with *active* rooms. Per-IP limits trust `CF-Connecting-IP` / `X-Forwarded-For` — keep the relay behind cloudflared/nginx in production.

## Paid managed sync (later)

Same default URL for hosted users. Subscription gating will live on the **relay** (token on connect), not in picking a different frontend URL.

## Code

- `choreboard/web/src/lib/relayUrl.ts` — default + override helpers
- `choreboard/web/src/components/RelaySettings.tsx` — Settings UI
