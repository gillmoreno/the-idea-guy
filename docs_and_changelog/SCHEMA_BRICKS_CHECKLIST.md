# Schema bricks — manual UI checklist (v1)

Run after any SchemaEngine CSS or field renderer change.

## Automated gate (run first)

```bash
# terminal 1
cd apps/rooms && make dev

# terminal 2
make schema-qa
```

Must pass before merging SchemaEngine CSS changes. See [SCHEMA_UI_QA.md](./SCHEMA_UI_QA.md).

Visual preview: http://localhost:3300/schema/preview

## Manual setup (optional)

1. `cd apps/rooms && make dev-fresh`
2. **Create → Paste JSON → Brick fixture — test every v1 element**
3. Validate → Create → finish setup as owner

## Add one test record

| Field | Test value |
|-------|------------|
| Title | `Long title that wraps onto multiple lines without overlapping the emoji` |
| Emoji | `🎬` |
| Notes | `Multi-line pitch.\nSecond line.` |
| Labels | `alpha, beta, gamma` |

## Pass criteria

### Layout
- [ ] Title does **not** overlap emoji or vote button
- [ ] Emoji sits in a small square tile (not the large gradient orb)
- [ ] Vote button stays on the right, does not crush title
- [ ] Tags render as separate pills with wrapping
- [ ] Notes render below title as muted paragraph
- [ ] Status dropdown is full width below content

### Field inputs (Add form)
- [ ] `text` — normal input
- [ ] `emoji` — shared `EmojiPicker` (search, categories, recents; not a text input)
- [ ] `textarea` — multi-line
- [ ] `tags` — comma hint placeholder

### Features
- [ ] **votes** — tap toggles; count increments; list re-sorts when multiple records
- [ ] **status** — owner can change; member cannot (join second browser without admin)

### Themes
- [ ] Repeat quick check on **Glow** and **Paper** themes

## Code map (one brick = one file)

| Brick | Render |
|-------|--------|
| `text` | `RecordCard` title + `FieldInput` |
| `textarea` | `FieldBody` pitch style |
| `tags` | `FieldBody` tags row |
| `emoji` | `schema-record__emoji` tile |
| `votes` | `RecordCard` vote button |
| `status` | `schema-record__status` select |

## Related

- [SCHEMA_SPEC_V1.md](./SCHEMA_SPEC_V1.md)
