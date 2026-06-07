---
name: choreboard-relay-deploy
description: >-
  Deploy the ChoreBoard WebSocket sync relay to relay.the-idea-guy.com via
  Docker and cloudflared tunnel. Use when the user asks to deploy the relay,
  backend, sync server, wss://relay, or ChoreBoard infrastructure (not the
  web UI — that is cloudflare-subdomain-deploy).
disable-model-invocation: true
---

# ChoreBoard relay deploy

The **relay** is the Go WebSocket server in `choreboard/relay/`. It stores opaque encrypted blobs — it cannot run on Cloudflare Pages. Production URL: **`wss://relay.the-idea-guy.com`**.

The **web app** (ChoreBoard PWA) is a separate deploy — use skill **`cloudflare-subdomain-deploy`** (`./scripts/deploy-chores.sh`).

## Quick reference

| Item | Location |
|------|----------|
| Relay code | `choreboard/relay/` |
| Deploy script | `scripts/deploy-relay.sh` |
| DNS fix (API) | `scripts/relay-route-dns.sh` |
| Deployer (shared) | `~/Infrastructure/deployer/deploy.sh` |
| Secrets (DNS API) | `deploy/.env` — same `CLOUDFLARE_API_TOKEN` as Pages deploy |
| Full guide | `docs_and_changelog/CHOREBOARD_RELAY.md` |

## Prerequisites (once per machine)

- [ ] **Docker** running
- [ ] **cloudflared** installed (`brew install cloudflared`)
- [ ] **`cloudflared tunnel login`** completed
- [ ] **`~/Infrastructure/deployer/deploy.sh`** exists (or set `DEPLOYER_SCRIPT`)
- [ ] **`deploy/.env`** with `CLOUDFLARE_API_TOKEN` (for `relay-route-dns.sh` on the-idea-guy.com zone)

## Deploy

From repo root:

```bash
chmod +x scripts/deploy-relay.sh scripts/relay-route-dns.sh   # once
./scripts/deploy-relay.sh
```

This will:

1. Build and run the relay in Docker on port **4500** (`choreboard/relay/docker-compose.yml`)
2. Ensure tunnel **`choreboard-relay`** exists
3. Write `~/.cloudflared/config-choreboard-relay.yml`
4. Install launchd service `com.cloudflare.cloudflared.choreboard-relay` (**requires sudo**)
5. Route DNS **`relay.the-idea-guy.com`** → tunnel (via deployer + `relay-route-dns.sh`)

Manual equivalent:

```bash
DEPLOY_DOMAIN=the-idea-guy.com \
  ~/Infrastructure/deployer/deploy.sh deploy choreboard-relay relay 4500 \
  "$(pwd)/choreboard/relay"
```

## Agent checklist

When the user asks to deploy the relay:

- [ ] Confirm they mean **relay/backend**, not the ChoreBoard UI (→ `cloudflare-subdomain-deploy`)
- [ ] Check prerequisites: Docker, cloudflared, deployer script, `deploy/.env`
- [ ] Run `./scripts/deploy-relay.sh` from repo root
- [ ] If script exits non-zero at **sudo**, explain: Docker + DNS fallback may still have run; user must re-run in a **real terminal** to install launchd, or confirm cloudflared is already running in background
- [ ] **Verify** (always run after deploy):

```bash
curl -sS https://relay.the-idea-guy.com/healthz          # → ok
docker ps --filter name=choreboard-relay --format '{{.Names}} {{.Status}}'
pgrep -fl 'config-choreboard-relay' || echo 'cloudflared not running'
```

- [ ] Report health URL and whether tunnel/Docker are up
- [ ] Remind: web app must be built with `NEXT_PUBLIC_RELAY_URL=wss://relay.the-idea-guy.com` (default in `deploy/subdomains.json`) — redeploy UI only if relay URL changed

## Sudo / launchd

The deployer copies tunnel config to `/etc/cloudflared/` and installs a **launchd** service so cloudflared survives reboots. That step needs the user's Mac password — **not available in non-interactive agent shells**.

If deploy stops at sudo:

1. Script still rebuilds Docker and may start cloudflared in background
2. Tell the user to run `./scripts/deploy-relay.sh` once in Terminal for launchd
3. Or verify `pgrep -fl config-choreboard-relay` — background tunnel may already be enough

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Deploy script not found` | Set `DEPLOYER_SCRIPT` to your `Infrastructure/deployer/deploy.sh` path |
| `sudo: a password is required` | Re-run `./scripts/deploy-relay.sh` in Terminal; or rely on background cloudflared |
| `healthz` fails / connection refused | `cd choreboard/relay && docker compose up -d --build`; check port 4500 |
| DNS wrong zone (aigil.dev) | Run `./scripts/relay-route-dns.sh` — see `CHOREBOARD_RELAY.md` |
| Sync broken in prod UI | Relay up? `curl healthz`. UI built with correct `NEXT_PUBLIC_RELAY_URL`? |
| Tunnel exists but not running | `cloudflared tunnel --config ~/.cloudflared/config-choreboard-relay.yml run` or fix launchd |

## Environment overrides

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEPLOYER_SCRIPT` | `~/Infrastructure/deployer/deploy.sh` | Shared deployer |
| `CHOREBOARD_RELAY_TUNNEL` | `choreboard-relay` | Tunnel name |
| `CHOREBOARD_RELAY_SUBDOMAIN` | `relay` | Hostname label |
| `CHOREBOARD_RELAY_PORT` | `4500` | Local relay port |
| `DEPLOY_DOMAIN` | `the-idea-guy.com` | Apex domain |

Relay container env (`RELAY_ADDR`, `RELAY_DATA_DIR`): see `docs_and_changelog/CHOREBOARD_RELAY.md`.

## Related

- **Web UI deploy:** `.cursor/skills/cloudflare-subdomain-deploy/` → `./scripts/deploy-chores.sh`
- **Self-hosters** can override relay URL in app **Settings → Sync relay** without redeploying UI
