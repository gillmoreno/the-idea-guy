# ChoreBoard

Family chores and allowance tracker — **local-first**, end-to-end encrypted, your data stays on your devices.

First mini-app on the [Local-First Kit](../docs_and_changelog/LOCAL_FIRST_KIT.md). Full product spec: [CHOREBOARD_SPEC.md](../docs_and_changelog/CHOREBOARD_SPEC.md).

## Quick start (development)

You need two processes: the **sync relay** (WebSocket) and the **web app** (Next.js).

```bash
# From choreboard/
make dev
```

Or in two terminals:

```bash
make dev-relay   # ws://localhost:4500
make dev-web     # http://localhost:3100
```

Open **http://localhost:3100**, tap **Create a family**, finish setup, then copy the invite code from **Settings** and open a second browser (or private window) → **Join an existing family** with that code. Changes should sync within a couple of seconds.

## Layout

```
choreboard/
├── relay/          Go WebSocket relay (opaque encrypted blobs only)
├── web/            Next.js 15 PWA (Yjs + IndexedDB + AES-GCM sync client)
└── Makefile
```

## How it works

1. Each family has an **invite code** (e.g. `amber-tiger-maple-river`).
2. All chore data lives in a **Yjs CRDT** document, persisted in **IndexedDB** on each device.
3. Updates are **encrypted** (AES-256-GCM, key derived from the invite code) before they hit the relay.
4. The relay only stores and forwards **ciphertext** — it cannot read your family's data.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_ADDR` | `:4500` | Go relay listen address |
| `RELAY_DATA_DIR` | (empty) | If set, append-only encrypted blob log on disk |
| `NEXT_PUBLIC_RELAY_URL` | `ws://localhost:4500` | WebSocket URL for the web app |

## Production build

```bash
make build
# Static site: web/out — host on any CDN
# Relay binary: relay/bin/relay — run behind TLS (wss://)
```

For production, set `NEXT_PUBLIC_RELAY_URL` to your `wss://` relay when building the web app.

## v1 features

- Family setup with configurable currency (default USD) and payday
- Chore catalog with difficulty tiers and seed chores
- Kid dashboard: mark done, running balance, suggest chores
- Parent dashboard: approvals, chore CRUD, payday, penalties, invite code
- PWA: manifest + service worker (Add to Home Screen)
