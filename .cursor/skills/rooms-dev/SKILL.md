---
name: rooms-dev
description: >-
  Run the Rooms meta-app locally for development — always needs the Go WebSocket
  relay (backend sync) plus the Next.js dev frontend. Use when the user asks to
  run, test, or develop Rooms locally, dev mode, local sync, ChoreBoard in Rooms,
  relay not connecting, or starting the local stack. Prefer make dev; use Docker
  for the relay when they want a production-like backend container.
---

# Rooms — local dev

The **Rooms** app is two processes. **Never run only the frontend** — sync will not work without the relay.

| Process | Role | Local URL |
|---------|------|-----------|
| **Relay** (Go) | Dumb WebSocket sync — opaque encrypted blobs | `ws://localhost:4500` |
| **Web** (Next.js dev) | Meta PWA + templates (ChoreBoard, …) | `http://localhost:3300` |

Repo layout:

| Item | Path |
|------|------|
| Meta app | `apps/rooms/web/` |
| Shared kit | `packages/room-kit/` |
| Relay | `relay/` (repo root — not `choreboard/relay/`) |
| Makefile | `apps/rooms/Makefile` |
| Docs | `docs_and_changelog/ROOM_KIT.md` |

Build-time env for local dev (set by Makefile — do not skip):

- `NEXT_PUBLIC_RELAY_URL=ws://localhost:4500`
- Default app URL in code: `https://rooms.the-idea-guy.com` (invite links use `window.location.origin` in the browser)

---

## Default: one command (Go relay + Next dev)

From repo root:

```bash
cd apps/rooms
make dev
```

Open **http://localhost:3300**

This starts:

1. `go run .` in `relay/` on `:4500`
2. `npm run dev` in `apps/rooms/web` on `:3300`

---

## Docker relay + Next dev (production-like backend)

When the user wants the **Go backend in Docker** (same image as deploy) with **hot-reload frontend**:

**Option A — one command:**

```bash
cd apps/rooms
make dev-docker
```

**Option B — two terminals:**

```bash
# Terminal 1 — relay in Docker
cd apps/rooms && make dev-relay-docker

# Terminal 2 — Next.js dev
cd apps/rooms && make dev-web
```

Relay compose file: `relay/docker-compose.yml` (port **4500**, volume for `RELAY_DATA_DIR`).

---

## Two terminals (Go relay, no Docker)

```bash
cd apps/rooms && make dev-relay    # Terminal 1
cd apps/rooms && make dev-web      # Terminal 2
```

---

## Agent checklist

When the user wants to run or test Rooms locally:

- [ ] Confirm **both** relay and web are needed (not frontend-only)
- [ ] `cd apps/rooms` — run **`make dev`** unless they asked for Docker relay → **`make dev-docker`**
- [ ] First time or after pull: `cd apps/rooms/web && npm install`
- [ ] **Verify relay** before declaring success:

```bash
curl -s http://localhost:4500/healthz    # → ok
```

- [ ] **Verify web**: open `http://localhost:3300` (or report dev server log URL)
- [ ] For sync testing: create room in browser A → join with code in browser B (private window)
- [ ] If sync fails: check relay running, `NEXT_PUBLIC_RELAY_URL=ws://localhost:4500`, browser console WebSocket errors

Do **not** tell the user to open only `npm run dev` without the relay unless you start the relay in parallel.

---

## Static preview (not dev mode)

If they want a **production-like static build** (not hot reload):

```bash
cd apps/rooms && make preview-all   # relay + build web/out + serve
```

See `docs_and_changelog/ROOM_KIT.md` — dev mode vs preview.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Sync never connects | Relay down — `curl localhost:4500/healthz` |
| `EADDRINUSE :4500` | Kill old relay: `lsof -i :4500` or `docker stop choreboard-relay` |
| Web starts but wrong relay | Must use `make dev-web` or export `NEXT_PUBLIC_RELAY_URL=ws://localhost:4500` |
| Empty `/` after code changes | Hard refresh; check `apps/rooms/web` not old `choreboard/web` |
| Docker relay won't build | Docker daemon running; `cd relay && docker compose up --build` |
| `npm install` errors | Run from `apps/rooms/web`; room-kit is `file:../../../packages/room-kit` |

---

## Related skills

| Task | Skill / script |
|------|----------------|
| Deploy relay to production | `.cursor/skills/choreboard-relay-deploy/` → `./scripts/deploy-relay.sh` |
| Deploy Rooms UI to Cloudflare | `./scripts/deploy-rooms.sh` |
| Architecture | `docs_and_changelog/ROOM_KIT_ARCHITECTURE.md` |

Production relay: `wss://relay.the-idea-guy.com` — **not** used during local dev when Makefile env is set correctly.
