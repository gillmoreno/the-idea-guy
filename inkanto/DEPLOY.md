# Deploying Inkanto → inkanto.theideaguy.com

Goal: run the single Inkanto container on the deploy machine and expose it as
**https://inkanto.theideaguy.com** under The Idea Guy umbrella.

Everything below happens **on the deploy machine** (this repo committed & pulled there).

## 0. Prerequisites

- Docker + docker compose
- DNS: `A` (or `CNAME`) record `inkanto.theideaguy.com` → deploy server IP
- A host-level reverse proxy for TLS (Caddy recommended, or nginx + certbot).
  **HTTPS is required, not optional**: the PWA service worker, `Add to Home Screen`,
  clipboard copy, and the native share sheet all need a secure origin.

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

## 3. Reverse proxy + TLS

Caddy (simplest — automatic certificates):

```
inkanto.theideaguy.com {
    reverse_proxy localhost:3400
}
```

nginx alternative: proxy_pass to `http://127.0.0.1:3400`, then `certbot --nginx`.
Either way, make sure SSE isn't buffered for the coach stream
(Caddy: fine by default; nginx: `proxy_buffering off` on the location).

## 4. Smoke test

1. Open https://inkanto.theideaguy.com → register with the `FAMILY_CODE`.
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
- Link Inkanto from the theideaguy.com builds/portfolio page once live
