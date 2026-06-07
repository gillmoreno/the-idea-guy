# Second Brain — HTML knowledge vault MVP

> Local-first personal notes with HTML editing, internal links, search, sync, and AI chat.
> Mini-app #3 on the [Local-First Kit](./LOCAL_FIRST_KIT.md).

## What shipped

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Vault + Tiptap HTML editor + sidebar CRUD | ✅ |
| 2 | `[[` internal links, backlink index, MiniSearch | ✅ |
| 3 | Relay sync (`appId: secondbrain`), invite vault, offline badge | ✅ |
| 4 | AI chat + summarize (per-vault API key, dumb relay forward) | ✅ |
| 5 | Force-directed graph from `linkIndex` | ✅ |

## Architecture

```
secondbrain/web (PWA)
  ├── NoteStore on Y.Doc (notes, folders, linkIndex)
  ├── Tiptap + @tiptap/extension-collaboration → Y.XmlFragment per note
  ├── MiniSearch index rebuilt on note save
  └── LocalFirstDoc (kit/sync.ts) → encrypted relay

secondbrain/relay
  ├── /sync — opaque CRDT blob relay (shared kit pattern)
  └── /ai/forward — dumb CORS tunnel (user Bearer token, no server key)

// Y.Map "settings" → ai: { apiKey, model } — E2E synced per vault
```

## Data model

```typescript
interface Note {
  id: string;
  title: string;
  html: string;        // derived from editor on save
  plainText: string;   // for search + AI retrieval
  folderId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Y.Map "linkIndex" — noteId → { outgoing: string[], incoming: string[] }
```

Internal links in HTML:

```html
<a data-note-id="n_abc123" href="note://n_abc123">Project Ideas</a>
```

## Dev

```bash
cd secondbrain && make dev
# http://localhost:3200
```

See [secondbrain/README.md](../secondbrain/README.md) for env vars.

## Changelog

- **2026-06-07** — Per-vault AI keys in encrypted settings; relay no longer holds `OPENAI_API_KEY`. See [SECOND_BRAIN_AI.md](./SECOND_BRAIN_AI.md).
- **2026-06-07** — UI refresh: dark mode, editor toolbar, callout blocks, landing redesign. See [SECOND_BRAIN_UI.md](./SECOND_BRAIN_UI.md).
- **2026-05-31** — Initial MVP: vault, editor, links, search, sync, AI, graph.
