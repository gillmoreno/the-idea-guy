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

## Local dev

```bash
cd apps/rooms
make dev
```

- Relay: `ws://localhost:4500`
- Web: `http://localhost:3300`

Or two terminals:

```bash
make dev-relay
make dev-web
```

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
