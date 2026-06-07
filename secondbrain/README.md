# Second Brain

Personal HTML knowledge vault — **local-first**, end-to-end encrypted, with internal links, full-text search, AI chat, and a note graph.

Built on the [Local-First Kit](../docs_and_changelog/LOCAL_FIRST_KIT.md). Full spec: [SECOND_BRAIN.md](../docs_and_changelog/SECOND_BRAIN.md).

## Quick start (development)

You need two processes: the **sync relay** (WebSocket only) and the **web app** (Next.js).

```bash
# From secondbrain/
make dev
```

Or in two terminals:

```bash
make dev-relay   # ws://localhost:4501 (+ dumb /ai/forward CORS tunnel)
make dev-web     # http://localhost:3200
```

Open **http://localhost:3200**, tap **Create a vault**, finish setup, then add your **OpenAI API key** in **Settings → AI**. Copy the invite code from Settings and open a second browser → **Join an existing vault** with that code.

## Layout

```
secondbrain/
├── relay/          Go WebSocket relay + dumb AI forward (no API keys)
├── web/            Next.js 15 PWA (Yjs + Tiptap + IndexedDB)
└── Makefile
```

## Features (MVP)

- **HTML notes** — Tiptap editor bound to Yjs CRDT fragments (headings, lists, links, code blocks, images)
- **Internal links** — type `[[` to pick a note; links use `data-note-id` attributes
- **Backlinks** — incoming/outgoing links panel per note
- **Search** — MiniSearch over plain-text index
- **Sync** — encrypted relay sync with invite-code vault (`appId: secondbrain`)
- **AI chat** — your OpenAI key in the vault DB; keyword-retrieved excerpts only (never full vault)
- **Graph view** — force-directed graph from link index

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_ADDR` | `:4501` | Go relay listen address |
| `RELAY_DATA_DIR` | (empty) | Optional encrypted blob persistence |
| `NEXT_PUBLIC_RELAY_URL` | `ws://localhost:4501` | WebSocket URL for sync |
| `NEXT_PUBLIC_RELAY_HTTP_URL` | (derived from relay URL) | HTTP origin for `/ai/forward` CORS tunnel |

**No `OPENAI_API_KEY` on the relay.** Each vault stores its own key in the encrypted Yjs document (Settings → AI).

## Production build

```bash
make build
# Static site: web/out — host on any CDN
# Relay binary: relay/bin/relay — run behind TLS (wss:// + https://)
```

Set `NEXT_PUBLIC_RELAY_URL` when building the web app for production.

## Limitations (v1)

- Keyword search only (no vector embeddings)
- AI requires a user-provided OpenAI key in vault settings; no offline AI
- Graph view is read-only navigation (no drag-to-edit layout persistence)
- Folders are metadata filters only (no nested tree UI)
- Collaborative editing uses CRDT but no cursor presence
