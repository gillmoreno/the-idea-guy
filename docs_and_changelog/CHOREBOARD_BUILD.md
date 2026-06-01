# ChoreBoard — build log

**Date:** 2026-05-31  
**Status:** Phase 0–1 shipped in repo (local-first kit + core UI). Hosted deploy and paid sync tier not yet done.

## What shipped

### Local-First Kit (`choreboard/web/src/kit/`)

- `crypto.ts` — AES-256-GCM via Web Crypto; key + room derived from invite code
- `sync.ts` — `LocalFirstDoc`: Yjs + IndexedDB + encrypted WebSocket sync
- `invite.ts` — human-readable invite codes

### Relay (`choreboard/relay/`)

- Go WebSocket server: rooms, broadcast, optional disk persistence
- Cannot decrypt client payloads

### ChoreBoard app (`choreboard/web/`)

- Data model: family, members, chores, completions (rewards + penalties), payments
- Flows: welcome → setup (creator) or join → profile picker → kid/parent views
- Parent: home, approvals (completions + kid-proposed chores), chore catalog, payday, settings
- Kid: balance hero, chore list, mark done, suggest chore, recent activity
- PWA: `manifest.webmanifest`, `sw.js`, installable shell

### Idea Guy site

- `backend/data/ideas.json` — ChoreBoard entry, status `building`

## How to run

```bash
cd choreboard && make dev
```

Open http://localhost:3100. Test sync: two browsers, same invite code.

## Next (from spec)

- Phase 2 polish: calendar/history view, recurrence UX
- Hosted static deploy + public `wss://` relay (or self-host docs)
- Optional paid managed sync tier
- Extract Local-First Kit to its own package when a second mini-app needs it

## Locked product decisions

- Currency configurable, default **USD**
- One price per chore for all kids
- Penalties allowed (negative completion entries)
- Kids can propose chores for parent approval
