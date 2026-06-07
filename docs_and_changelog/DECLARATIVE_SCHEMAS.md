# Declarative room schemas

**Date:** 2026-06-07  
**Status:** v1 foundation shipped

---

## Two room kinds

| Kind | Who builds it | Runtime | Distribution |
|------|---------------|---------|--------------|
| **builtin** | Gil (compiled React) | Lazy-loaded app per template | Create → share invite |
| **declarative** | User + AI (JSON) | Shared **SchemaEngine** | Schema stored in encrypted room doc |

Relay unchanged — dumb blob sync only.

---

## Versioning (Lego bricks evolve safely)

- **`schemaVersion`** — shape of the JSON document. Migrations in `schema/migrate.ts` upgrade older rooms on load.
- **`engineVersion`** — minimum SchemaEngine build required. Older apps show “update required” instead of breaking.
- **Unknown field types / feature types** — ignored by older engines (forward compatible).
- **New bricks** — add field types (`date`, `number`, …) or features (`assign`, `tally`, …) without invalidating v1 rooms.

User-editing an existing room’s schema after create is **not** in v1 (complex). Rooms keep working as the engine gains bricks.

---

## Schema location

```
meta.templateKind: "declarative"
meta.templateId: "declarative"
meta.schema: { ... full RoomSchema ... }
template.declarative.board / members / data / votes
```

Built-in rooms use `templateKind: "builtin"` and `template.{choreboard|tripsplit|…}`.

---

## Create flows

1. **Built-in** — ChoreBoard, Trip Split, Book Club (Backlog owner-only in prod).
2. **Official schemas** — `public/catalog/v1.json` (marketplace you curate from Backlog).
3. **Paste JSON** — validate → stash in sessionStorage → owner setup writes to CRDT.

Join flow uses `templateId: _pending` until the synced doc reveals the real type.

---

## AI prompt

Copy `docs_and_changelog/prompts/ROOM_SCHEMA_PROMPT.md` into ChatGPT / Claude / Grok, describe the room, paste the JSON output on **Create → Paste JSON**.

---

## Code map

| Path | Role |
|------|------|
| `apps/rooms/web/src/schema/types.ts` | Schema + feature definitions |
| `apps/rooms/web/src/schema/validate.ts` | Paste validation |
| `apps/rooms/web/src/schema/migrate.ts` | Backward-compatible upgrades |
| `apps/rooms/web/src/schema/store.ts` | Yjs CRUD |
| `apps/rooms/web/src/schema/engine/` | SchemaEngine UI |
| `apps/rooms/web/src/templates/TemplateApp.tsx` | Routes builtin vs declarative |
| `apps/rooms/web/public/catalog/v1.json` | Official marketplace |

---

## Related

- [ROOM_KIT_ARCHITECTURE.md](./ROOM_KIT_ARCHITECTURE.md)
- [BACKLOG.md](./BACKLOG.md) — product board → catalog entries
