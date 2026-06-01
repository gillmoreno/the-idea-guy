# Second Brain

Personal HTML knowledge vault — **local-first**, end-to-end encrypted, with internal links, full-text search, AI chat, and a note graph.

Built on the [Local-First Kit](../docs_and_changelog/LOCAL_FIRST_KIT.md). Full spec: [SECOND_BRAIN.md](../docs_and_changelog/SECOND_BRAIN.md).

## Quick start (development)

You need two processes: the **sync relay** (WebSocket + optional AI proxy) and the **web app** (Next.js).

```bash
# From secondbrain/
make dev
```

Or in two terminals:

```bash
make dev-relay   # ws://localhost:4501 (+ POST /ai/chat)
make dev-web     # http://localhost:3200
```

Open **http://localhost:3200**, tap **Create a vault**, finish setup, then copy the invite code from **Settings** and open a second browser → **Join an existing vault** with that code.

## Layout

```
secondbrain/
├── relay/          Go WebSocket relay + thin OpenAI proxy
├── web/            Next.js 15 PWA (Yjs + Tiptap + IndexedDB)
└── Makefile
```

## Features (MVP)

- **HTML notes** — Tiptap editor bound to Yjs CRDT fragments (headings, lists, links, code blocks)
- **Internal links** — type `[[` to pick a note; links use `data-note-id` attributes
- **Backlinks** — incoming/outgoing links panel per note
- **Search** — MiniSearch over plain-text index
- **Sync** — encrypted relay sync with invite-code vault (`appId: secondbrain`)
- **AI chat** — keyword-retrieved note excerpts sent to thin relay proxy (never full vault)
- **Graph view** — force-directed graph from link index

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_ADDR` | `:4501` | Go relay listen address |
| `RELAY_DATA_DIR` | (empty) | Optional encrypted blob persistence |
| `NEXT_PUBLIC_RELAY_URL` | `ws://localhost:4501` | WebSocket URL for sync |
| `NEXT_PUBLIC_AI_URL` | `http://localhost:4501` | HTTP URL for AI proxy (`/ai/chat`) |
| `OPENAI_API_KEY` | (required for AI) | Set on relay process |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model for AI responses |

## Production build

```bash
make build
# Static site: web/out — host on any CDN
# Relay binary: relay/bin/relay — run behind TLS (wss:// + https://)
```

Set `NEXT_PUBLIC_RELAY_URL` and `NEXT_PUBLIC_AI_URL` when building the web app for production.

## Limitations (v1)

- Keyword search only (no vector embeddings)
- AI requires `OPENAI_API_KEY` on relay; no offline AI
- Graph view is read-only navigation (no drag-to-edit layout persistence)
- Folders are metadata filters only (no nested tree UI)
- Collaborative editing uses CRDT but no cursor presence
