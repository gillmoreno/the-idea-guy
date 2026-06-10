# The Idea Guy — monorepo

Three products, none deployed yet:

| Product | Path | Dev | Port |
|---------|------|-----|------|
| Rooms (meta-PWA, room templates) | `apps/rooms/web` | `npm run dev` | 3300 (relay `relay/` :4500) |
| Second Brain (notes vault + AI) | `secondbrain/` | `make dev` | web 3200, relay 4501 |
| Website (brand site) | `frontend/` + `backend/` | `npm run dev` | 3000 (Go API + nginx in Docker) |

Shared local-first kit: `packages/room-kit` (Yjs CRDT sync, Argon2id/AES-256-GCM crypto, device vault + PIN lock, invite links in URL hash). `choreboard/` at the root is the **legacy standalone** app — current ChoreBoard lives in `apps/rooms/web/src/templates/choreboard/`.

## Hard rules

- **Yjs single instance:** templates import `Y` from `@the-idea-guy/room-kit`, never from `yjs` directly (duplicate Yjs corrupts CRDT state — see `docs_and_changelog/BACKLOG.md`).
- The relay must stay dumb: it moves opaque encrypted blobs and never gains the ability to read room data.
- Invite codes go in the URL **hash**, never in query strings or paths (keeps them out of CDN/server logs).

## Documentation (keep in sync)

Human-readable technical docs are an HTML site: open `docs_and_changelog/html/index.html`.

- `doc-manifest.json` in that folder maps features → sources → pages; a post-commit hook flags stale pages via `.cursor/docs-sync-reminder.json`.
- **After changing code, run the `html-docs` skill** (`.claude/skills/html-docs/`) to sync stale pages; it can fan out to the `doc-page-writer` agent.
- Feature prioritization lives at `docs_and_changelog/html/backlog.html` (RICE-scored) — maintained by the `rice-backlog` skill.
- Deep specs are markdown in `docs_and_changelog/*.md`; HTML pages link to them rather than duplicating.

## Schema QA

After touching `apps/rooms/web/src/schema/`, run `npm run qa:schema-ui` in `apps/rooms/web`.
