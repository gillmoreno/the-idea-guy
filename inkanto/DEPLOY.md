# Deploying Inkanto → inkanto.the-idea-guy.com

Goal: run the single Inkanto container on the deploy machine and expose it as
**https://inkanto.the-idea-guy.com** under The Idea Guy umbrella.

Everything below happens **on the deploy machine** — same machine that runs the
ChoreBoard relay (`relay.the-idea-guy.com`), exposed via a cloudflared tunnel.

## 0. Prerequisites

- Docker + docker compose
- cloudflared logged in (see `docs_and_changelog/CLOUDFLARED_MULTI_ZONE.md` —
  DNS on `the-idea-guy.com` goes through the API script or the Zero Trust
  dashboard, since the CLI cert is scoped to aigil.dev)
- **HTTPS is required, not optional**: the PWA service worker, `Add to Home Screen`,
  clipboard copy, and the native share sheet all need a secure origin. The
  Cloudflare tunnel provides TLS at the edge, so no local Caddy/certbot is needed.

## 1. Configure

```sh
cd inkanto
cp .env.example .env
```

Fill `.env`:

| Var | How |
|---|---|
| `SECRET_KEY` | `openssl rand -hex 32` |
| `FAMILY_CODE` | pick the family word — required to register, this is the only signup gate |
| `CLAUDE_CODE_OAUTH_TOKEN` | run `claude setup-token` (any machine with Claude Code logged in), paste the 1-year token |
| `INKANTO_MODEL` | leave `claude-opus-4-8` |

## 2. Run the container

```sh
just deploy        # = docker compose up -d --build → serves on host :3400
curl localhost:3400/health   # {"status":"ok"}
```

The container bundles nginx + Go API + AI sidecar (supervisord auto-restarts each).
SQLite data lives in `inkanto/data/` on the host (compose volume).

## 3. Expose via cloudflared tunnel

Same pattern as the ChoreBoard relay (`scripts/deploy-relay.sh`):

```sh
cloudflared tunnel create inkanto
# Tunnel config (~/.cloudflared/config-inkanto.yml):
#   tunnel: <TUNNEL_ID>
#   credentials-file: ~/.cloudflared/<TUNNEL_ID>.json
#   ingress:
#     - hostname: inkanto.the-idea-guy.com
#       service: http://localhost:3400
#     - service: http_status:404
cloudflared tunnel --config ~/.cloudflared/config-inkanto.yml run   # or install as launchd service
```

DNS: create a proxied CNAME `inkanto` → `<TUNNEL_ID>.cfargotunnel.com` on the
**the-idea-guy.com** zone via the Cloudflare API (same token as `deploy/.env`)
or the Zero Trust dashboard — **not** `cloudflared tunnel route dns`, whose cert
is scoped to aigil.dev (see `docs_and_changelog/CLOUDFLARED_MULTI_ZONE.md`).

SSE note: Cloudflare passes the coach's SSE stream through fine by default;
the in-container nginx already has buffering configured.

## 4. Smoke test

1. Open https://inkanto.the-idea-guy.com → register with the `FAMILY_CODE`.
2. Create a story, open the coach, send one message → reply must stream.
3. Libro tab → Condividi → open the share link in an incognito window.
4. On her phone: open the site → Add to Home Screen → app icon works offline-shell.

## 5. Aftercare

- **Backups**: `inkanto/data/inkanto.sqlite3` is the whole world — cron a daily copy
  (e.g. `sqlite3 data/inkanto.sqlite3 ".backup backups/inkanto-$(date +%F).sqlite3"`).
- **Token renewal**: `CLAUDE_CODE_OAUTH_TOKEN` lasts ~1 year and does NOT auto-rotate.
  When the coach starts failing with auth errors, re-run `claude setup-token`,
  update `.env`, `docker compose up -d`.
- **Credit**: the coach draws from the Claude plan's monthly Agent SDK credit.
  If exhausted, the coach errors but writing keeps working.
- **Updates**: `git pull && just deploy` (image rebuilds, data volume untouched).

## Later / nice-to-have

- EPUB export endpoint in the Go backend (epub = zip of XHTML; serve from Libro tab)
- Author-level default voice shared across stories
- Link Inkanto from the the-idea-guy.com builds/portfolio page once live
