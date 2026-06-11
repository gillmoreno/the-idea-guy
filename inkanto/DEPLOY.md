# Deploying Inkanto → inkanto.the-idea-guy.com

Inkanto runs as a single Docker container **on this machine** and is exposed as
**https://inkanto.the-idea-guy.com** through the existing `choreboard-relay`
Cloudflare tunnel (same one that serves rooms.the-idea-guy.com). Cloudflare
terminates TLS, so no host-level reverse proxy or certbot is needed — the PWA
service worker, Add to Home Screen, clipboard copy, and share sheet all get
their secure origin from the tunnel.

## Moving parts

| Piece | Where |
|---|---|
| Container (nginx + Go API + AI sidecar via supervisord) | `inkanto/` — `docker compose up -d --build`, host port :3400 |
| Tunnel ingress | `~/.cloudflared/config-choreboard-relay.yml` — `inkanto.the-idea-guy.com → http://localhost:3400` |
| Tunnel process | LaunchAgent `com.cloudflare.cloudflared.choreboard-relay` |
| DNS | CNAME `inkanto` → `f3e1a2ac-d0e8-4be6-a246-6c0d76cfe8c8.cfargotunnel.com` (proxied) on the `the-idea-guy.com` zone |
| Data | SQLite in `inkanto/data/` on the host (compose volume → `/data`) |

## Configure

```sh
cd inkanto
cp .env.example .env   # already done on the deploy machine
```

| Var | How |
|---|---|
| `SECRET_KEY` | `openssl rand -hex 32` |
| `INKANTO_USERS` | `user:pass,user:pass` — there is no signup page; accounts listed here are created at startup if missing (existing users are never modified) |
| `CLAUDE_CODE_OAUTH_TOKEN` | run `claude setup-token` (any machine with Claude Code logged in), paste the 1-year token |
| `INKANTO_MODEL` | leave `claude-opus-4-8` |

After editing `.env`: `docker compose up -d` (no rebuild needed for env changes).

## Deploy / redeploy

```sh
cd inkanto
just deploy                  # = docker compose up -d --build
curl localhost:3400/health   # {"status":"ok"}
curl https://inkanto.the-idea-guy.com/health
```

The tunnel only needs touching if the ingress config changes:

```sh
cloudflared tunnel --config ~/.cloudflared/config-choreboard-relay.yml ingress validate
launchctl kickstart -k "gui/$(id -u)/com.cloudflare.cloudflared.choreboard-relay"
```

Note: cloudflared passes the coach's SSE stream through unbuffered; the
in-container nginx already has `proxy_buffering off` on `/api/`.

## Smoke test

1. Open https://inkanto.the-idea-guy.com → log in with an `INKANTO_USERS` account.
2. Create a story, open the coach, send one message → reply must stream.
3. Libro tab → Condividi → open the share link in an incognito window.
4. On her phone: open the site → Add to Home Screen → app icon works offline-shell.

## Aftercare

- **Backups**: `inkanto/data/inkanto.sqlite3` is the whole world — cron a daily copy
  (e.g. `sqlite3 data/inkanto.sqlite3 ".backup backups/inkanto-$(date +%F).sqlite3"`).
- **Token renewal**: `CLAUDE_CODE_OAUTH_TOKEN` lasts ~1 year and does NOT auto-rotate.
  When the coach starts failing with auth errors, re-run `claude setup-token`,
  update `.env`, `docker compose up -d`.
- **Credit**: the coach draws from the Claude plan's monthly Agent SDK credit.
  If exhausted, the coach errors but writing keeps working.
- **Updates**: `git pull && just deploy` (image rebuilds, data volume untouched).
- **Machine reboot**: Docker (`restart: unless-stopped`) and the tunnel LaunchAgent
  both come back on their own.

## Later / nice-to-have

- EPUB export endpoint in the Go backend (epub = zip of XHTML; serve from Libro tab)
- Author-level default voice shared across stories
- Link Inkanto from the theideaguy.com builds/portfolio page once live
