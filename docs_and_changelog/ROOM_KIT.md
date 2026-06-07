# Room Kit — getting started

**Date:** 2026-06-07

The **Rooms** meta-app is the local-first shell for invite-code rooms. Templates (ChoreBoard first) plug into one PWA and one dumb relay.

Full architecture: [ROOM_KIT_ARCHITECTURE.md](./ROOM_KIT_ARCHITECTURE.md)

## Repo layout

```
packages/room-kit/     Shared crypto, sync, vault, invite links
relay/                 Go WebSocket relay (opaque blobs only)
apps/rooms/web/        Meta PWA (Next.js static export)
  src/shell/           Home, create, join, room session
  src/templates/       Template plugins (choreboard, …)
```

## Local dev (hot reload)

**Skill:** `.cursor/skills/rooms-dev/` — agent checklist for relay + frontend.

```bash
cd apps/rooms
make dev              # Stop old dev processes, then relay + Next dev
make dev-restart      # Same as make dev
make dev-stop         # Kill only (ports 4500 + 3300)
make dev-docker       # Docker relay + Next dev
```

- Relay: `ws://localhost:4500`
- Web: `http://localhost:3300`

Or two terminals:

```bash
make dev-relay        # or make dev-relay-docker
make dev-web
```

## Local static preview (production-like)

Same as Cloudflare Pages: `next build` → static files in `web/out`, served by a simple HTTP server.

**One command** (relay + build + serve):

```bash
cd apps/rooms
make preview-all
```

Open **http://localhost:3300**

**Two terminals** (reuse a build):

```bash
# Terminal 1 — relay
cd apps/rooms && make dev-relay

# Terminal 2 — build with local env + serve web/out
cd apps/rooms && make preview
```

`preview` sets build-time env so the app talks to your local relay, not production:

- `NEXT_PUBLIC_RELAY_URL=ws://localhost:4500`
- `NEXT_PUBLIC_APP_URL=http://localhost:3300`

To test sync across devices on your LAN, rebuild with your machine IP:

```bash
cd apps/rooms/web
NEXT_PUBLIC_RELAY_URL=ws://192.168.1.10:4500 \
NEXT_PUBLIC_APP_URL=http://192.168.1.10:3300 \
npm run build
npx serve out -l 3300
```

(Run the relay bound to `0.0.0.0` if phones on the same Wi‑Fi need to connect: `RELAY_ADDR=:4500` already listens on all interfaces.)

## User flows

| URL | Action |
|-----|--------|
| `/` | My rooms, create, join |
| `/create` | Pick template → new room |
| `/join?code=…` | Member invite |
| `/join?code=…#admin=…` | Admin invite |
| `/room?c={roomCode}` | Open room → template UI |

## Deploy

```bash
./scripts/deploy-rooms.sh --init   # first time → rooms.the-idea-guy.com
./scripts/deploy-rooms.sh          # frontend only

./scripts/deploy-relay.sh          # relay.the-idea-guy.com (shared)
```

## Adding a template

1. Add entry to `apps/rooms/web/src/templates/registry.ts`
2. Create `src/templates/{id}/` with UI + Yjs data under `template.{id}.*`
3. Mount from `app/room/page.tsx` when `meta.templateId` matches

## Constants

- `APP_ID`: `rooms` (relay room namespace)
- Default relay: `wss://relay.the-idea-guy.com`
- Default app URL: `https://rooms.the-idea-guy.com`
