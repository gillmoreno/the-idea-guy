# Schema UI quality loop

Automated gate so declarative record cards never ship with overlapping text.

## Philosophy

**Don't use vision models for v1** — overlap detection uses browser geometry (`getBoundingClientRect`). It's fast, deterministic, and runs in CI.

Later you can add optional screenshot + LLM review for aesthetics; the hard rules stay programmatic.

## v1 rules (enforced)

| Rule | How |
|------|-----|
| No overlapping text blocks | Pairwise rect intersection inside each fixture |
| Readable font size | Computed `font-size` ≥ 12px on schema text elements |
| Title not clipped | `scrollHeight` vs `clientHeight` on title |

## The loop

```
1. Edit RecordCard / globals.css / FieldInput
2. Open http://localhost:3300/schema/preview  (visual check)
3. npm run qa:schema-ui                     (automated gate)
4. If fail → read JSON issues + qa-output/schema-preview-fail.png
5. Fix code → goto 2
```

From `apps/rooms`:

```bash
make dev          # terminal 1
make schema-qa    # terminal 2
```

## Preview page

`/schema/preview` renders fixed fixtures (Watch Club long title, brick fixture, minimal) across themes **without** creating a room or sync.

## Adding rules

Edit `apps/rooms/web/scripts/schema-ui-quality.mjs`:

- New selectors in `visibleTextElements`
- New issue types in the browser script
- New themes in the `themes` array

## CI (later)

```yaml
- run: cd apps/rooms/web && npm ci && npx playwright install chromium
- run: npm run dev & sleep 5 && npm run qa:schema-ui
```

## Related

- [SCHEMA_BRICKS_CHECKLIST.md](./SCHEMA_BRICKS_CHECKLIST.md)
- [SCHEMA_SPEC_V1.md](./SCHEMA_SPEC_V1.md)
