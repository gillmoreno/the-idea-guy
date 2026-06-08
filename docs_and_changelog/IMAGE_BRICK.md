# Image field brick

**Date:** 2026-06-07  
**Status:** v1 shipped

---

## Schema type

```json
{ "key": "photo", "label": "Photo", "type": "image" }
```

Stored in record `fields` as a JSON string:

| Kind | Shape | Sync weight |
|------|--------|-------------|
| **inline** | `{ "kind": "inline", "mime": "image/webp", "data": "<base64>" }` | ≤ 300 KB after client compression |
| **url** | `{ "kind": "url", "url": "https://…" }` | Link only — image not in CRDT |

---

## Upload path (smart / lean)

1. User picks a file (`ImageField` → Upload tab).
2. Client **center-crops to square**, scales down, encodes **WebP**.
3. Quality/size loop until **≤ 300 KB** (`lib/processImage.ts`).
4. Serialized inline value written to Yjs.
5. **`compactRoom()`** runs automatically to prune CRDT history (same idea as Second Brain vault compaction).

---

## Link path

User pastes a public `http`/`https` URL (iCloud share links, Google Photos, CDN, etc.). No bytes stored in the encrypted room doc.

---

## Code map

| Piece | Path |
|-------|------|
| Value types + parse | `apps/rooms/web/src/lib/imageValue.ts` |
| Crop + WebP compress | `apps/rooms/web/src/lib/processImage.ts` |
| Shared UI | `apps/rooms/web/src/components/ImageField.tsx` |
| Schema form | `schema/engine/FieldInput.tsx` |
| Schema card | `schema/engine/RecordCard.tsx` |
| Room compaction | `packages/room-kit/src/sync.ts` → `compactStorage()` |
| Session API | `shell/RoomSessionProvider.tsx` → `compactRoom()` |

---

## Consumers

- Declarative schemas (`type: "image"`)
- **Fit Crew** — optional workout proof photo

---

## Related

- [SCHEMA_SPEC_V1.md](./SCHEMA_SPEC_V1.md)
- [FIT_CREW.md](./FIT_CREW.md)
