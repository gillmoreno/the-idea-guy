# Rooms declarative schema — spec v1

**Status:** Shipped in SchemaEngine (`apps/rooms/web/src/schema/`)  
**Purpose:** Versioned “Lego bricks” for user- and AI-generated rooms.

---

## Versioning rules

| Field | Meaning |
|-------|---------|
| `schemaVersion` | Document shape. Bump when migrations required. |
| `engineVersion` | Minimum app build that understands features used. |

**Backward compatibility:**

- Older rooms load through `migrate.ts` (additive only).
- Unknown `field.type` or `feature.type` values are **skipped**, not executed.
- `extensions` object reserved for future per-room metadata.

---

## v1 field bricks

| type | Storage | UI |
|------|---------|-----|
| `text` | string | Single-line input |
| `textarea` | string | Multi-line |
| `tags` | `string[]` | Comma-separated input → pills |
| `emoji` | string | Shared `EmojiPicker` (full Unicode set, search, categories, recents); shown as record icon tile |
| `image` | string (JSON) | Shared `ImageField` — upload (auto-crop WebP ≤300 KB inline) or public URL link |

Future v2 candidates: `number`, `date`, `select`, `money`, `member` — not valid in v1 AI output.

---

## v1 feature bricks

| type | Purpose |
|------|---------|
| `votes` | Per-member upvote on a collection; sorts by count |
| `status` | Enum dropdown; `setBy`: `owner` \| `member` |

Future v2 candidates: `assign`, `dueDate`, `tally`, `reactions`.

---

## CRDT layout

```
meta.templateKind = "declarative"
meta.templateId = "declarative"
meta.schema = { ... RoomSchema ... }

template.declarative.board
template.declarative.members
template.declarative.data.{collectionId}.{recordId}
template.declarative.votes.{collectionId}.{recordId}.{memberId}
```

---

## AI workflow

1. **Create → Paste JSON**
2. **Copy system prompt** (in-app or `public/prompts/room-schema-v1.txt`)
3. Paste into ChatGPT / Claude / Grok; describe the room
4. Copy JSON output → **Validate** → **Create room**
5. Finish setup → share invite

Examples without AI: **Watch Club**, **Weekend Plans** buttons on Create.

---

## Files

| Path | Role |
|------|------|
| `src/schema/types.ts` | Brick definitions |
| `src/schema/validate.ts` | Paste gate |
| `src/schema/migrate.ts` | Upgrades |
| `src/schema/prompt.ts` | System prompt source of truth |
| `src/schema/examples.ts` | Test schemas |
| `public/catalog/v1.json` | Official marketplace |

---

## Related

- [DECLARATIVE_SCHEMAS.md](./DECLARATIVE_SCHEMAS.md)
- [prompts/ROOM_SCHEMA_PROMPT.md](./prompts/ROOM_SCHEMA_PROMPT.md)
