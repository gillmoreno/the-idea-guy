# Brick Polish — the component-quality loop

**Goal:** make every reusable building block ("brick") *perfect* — one canonical
implementation, visually unmistakable, used by every room that needs it. Run as a
recurring loop (sister to `/next-room`): each iteration takes **one brick**, audits
it, perfects it in the shared library, migrates every consumer, and ships.

This doc is the loop's contract: the **rubric** (what "perfect" means), the **loop
steps** (what one iteration does), and the **queue** (what to pick next). Update the
queue as bricks ship and new duplicated patterns surface.

---

## The core problem this loop exists to fix

There are **two rendering worlds** in the Rooms app, and they've drifted apart:

1. **The declarative engine** (`src/schema/engine/`) renders catalog rooms from a
   schema through **one** shared `RecordCard`. Consistent, but generic.
2. **The 20 builtin templates** (`src/templates/*/`) each hand-roll their own cards
   in a private `templates/<name>/components/ui.tsx`. **20 copies** of `Avatar`,
   `MoneyCents`, and the same card layout, drifting independently.

The result is the bug the user named: in **tripsplit**, an expense card renders the
key facts — *who paid, how much, who owes* — as one continuous run of muted 13px
text (`TripView.tsx:97` → `"2024-06-10 · Alex paid · split: Bob, Charlie"`). The
information is all there; the **visual hierarchy is not**. You can't answer "who
paid what?" in under two seconds. The amount lives on the far right, disconnected
from the payer. The split is a comma list with no structure.

This exact pattern is duplicated in **roomledger, groupfund, coparent** — fixing it
in one place fixes it everywhere only if there's *one place*. There isn't yet. That's
the work.

**Strategy:** extract a shared presentational **card/primitive kit** under
`src/components/kit/` used by *both* the engine and the bespoke templates. Each loop
iteration moves one pattern into the kit, perfects it, and deletes the copies.

---

## What "perfect" means — the rubric

A brick ships only when it passes **all** of these. The audit step scores the current
state against this list; the gap is the work.

1. **Single source.** One component in `src/components/kit/` (or `shell/` for
   stateful shell bricks). **Zero duplicates** — every consumer imports it; the
   per-template copy is deleted.
2. **Scannable in <2s.** The card's core question (*who paid what? whose turn? what's
   the score?*) is answerable at a glance, without reading a sentence. The single
   most important fact is visually dominant.
3. **Visual hierarchy, not a text run.** Distinct facts get distinct visual
   treatment (weight, size, color, position, chips) — never concatenated with `·`
   into one muted line. The amount sits *with* the actor it belongs to.
4. **Token-pure.** Only `globals.css` design tokens — no hardcoded hex, no magic
   spacing. Themeable via the room accent (`--template-accent`).
5. **Solo-first & proxy-aware.** Respects the people model: named participants
   (`AddPersonByName`), proxy attribution for records-of-fact, identity-bound only
   for acts of agency. A person renders as a consistent `PersonChip` (color dot +
   name), never a raw id, with a graceful fallback for unknown ids.
6. **Overflow-safe.** Long names, long descriptions, big amounts truncate or wrap
   gracefully (`minWidth:0`, ellipsis) — never push the amount off-screen.
7. **Accessible.** Semantic markup, tap targets ≥44px, AA contrast, `aria-*` where
   the meaning isn't in the text.
8. **Presentational & typed.** Takes plain data props, holds no room-specific logic,
   exports a clear props contract, and is reused by **≥2** templates (or the engine).
9. **States defined.** Empty, loading, and error/unknown states are designed — never
   a blank or a crash.
10. **Documented.** Has an entry in the HTML docs (run `html-docs`) and, ideally, a
    one-screen visual reference.

---

## One iteration of the loop

Pick **one** unit from the queue and carry it all the way to shipped.

1. **Pick.** Take the top of the queue — highest **(reuse count × visual pain)**.
   A "unit" is either an existing brick to perfect or a duplicated pattern to extract.
2. **Audit.** Find *every* consumer (grep the duplicated symbol, e.g. `MoneyCents`,
   `Avatar`, the card JSX). Score the current state against the rubric. Write the
   gap as a short before/after.
3. **Design.** Decide the canonical component + props contract. For visual bricks,
   sketch the new layout (where each fact goes, what's dominant). Reuse tokens.
4. **Build.** Implement in `src/components/kit/` (presentational) or `shell/`
   (stateful). Add CSS to `globals.css` using tokens.
5. **Migrate every consumer.** Replace each duplicate with the import. **Delete** the
   per-template copy. The engine's `RecordCard` should adopt the same primitive so
   declarative and builtin rooms look identical.
6. **QA.** `npm run build`; if `src/schema/` was touched, `npm run qa:schema-ui`.
   Use `/run` to eyeball the affected rooms (at least tripsplit + one declarative).
7. **Docs & backlog.** Run `html-docs` to sync. Retire the shipped row and queue any
   newly-revealed duplication via `rice-backlog`.
8. **Ship.** Commit + push + redeploy per the ship workflow (rebuild the image).

**When a pattern has no brick yet → extract one.** That's the "create new elements
forever" part: every iteration either perfects an existing brick or promotes a
duplicated pattern into a new one, shrinking the 20 bespoke `ui.tsx` files toward zero.

---

## The queue (prioritized)

Ordered by reuse × pain. Top of the list is the user's named bug.

### Tier 1 — money & people (the named pain, highest reuse)

| # | Brick | Extract from / replaces | Why now |
|---|-------|------------------------|---------|
| 1 | ~~**`RecordRow`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/RecordRow.tsx` (slot-based `leading`/`title`/`meta`/`trailing`, real `<button>` + focus ring when `onClick`; `.record-row` tokens, flex trailing). **Migrated 6 record cards across all 4 money rooms** — tripsplit expense (clickable), roomledger ledger ×2, groupfund contribution, coparent expense + stay. Each lost its duplicated wrapper + a11y boilerplate. Summary/config rows (coparent support-config, today-status) correctly left alone. `tsc`+`build` green. **Meta still passed through verbatim — the visible "text-run → chips" fix lands when #6 `MetaLine` / #5 `SplitView` slot into `RecordRow.meta`.** |
| 2 | ~~**`MoneyAmount`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/MoneyAmount.tsx` (`amount` \| `cents` + `currency`, sign-colored via `.amount-pos/neg`, `.money` adds tabular-nums). **Deleted `Money`×3 + `MoneyCents`×2; migrated 12 sites** across choreboard/roomledger/tripsplit; removed 2 now-empty `ui.tsx` (roomledger, tripsplit). sitcoop hours-balance & plain `formatMoney` text correctly left alone. `tsc`+`build` green. **Follow-up queued:** relocate `formatMoney` out of `templates/choreboard/lib/format.ts` to a neutral shared lib (kit currently imports it from a template). |
| 3 | ~~**`PersonChip`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/PersonChip.tsx` (`person` \| `name` + `fallback` for unknown ids; neutral dot when no color) + `.person-chip`/`__dot`/`__name` tokens (overflow-safe). **Migrated all 3 engine `RecordCard` dot+name blocks** (person field, statusBy, createdBy) → every declarative room. Removed the dead `.schema-record__status-by-dot` rule. `tsc`+`build`+`qa:schema-ui` (0 issues ×3 themes) green. **Follow-up:** template settle-up sentences (tripsplit/roomledger "X owes Y", bold inline names) could adopt `PersonChip` for dot consistency — deferred (weight/visual-noise call). |
| 4 | ~~**`Avatar`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `src/components/kit/Avatar.tsx` (+ `kit/index.ts` barrel, the kit's first brick). Props: `person:{name,color}` or scalar `name`/`color`, `large`, `title`; `aria-hidden` glyph + name tooltip, graceful `?` fallback. **All 20 copies deleted, 22 consumers on the kit, 16 now-empty `ui.tsx` removed.** Landed in two commits: `3717ee7` (19 templates) + `36af039` (tripsplit, with its split-math feature). 0 `Avatar` definitions remain in `templates/`. |
| 5 | ~~**`SplitView`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/SplitView.tsx`: per-person `PersonChip` + share amount (via shared `allocateShares`), wrapping/overflow-safe `.split-view` tokens. **Migrated tripsplit + roomledger expense cards** — the `split: a, b, c` muted comma run is gone, replaced by colored chips with each person's € share inside `RecordRow.meta`. **This closes the originally-named tripsplit clarity bug** (RecordRow gave the structure; SplitView gives the chips). `tsc`+`build` green. |

### Tier 2 — structure & states (consistency across all rooms)

| # | Brick | Replaces | Why |
|---|-------|----------|-----|
| 6 | ~~**`MetaLine`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/MetaLine.tsx` + `.meta-line` token. **Swept 59 inline `className="muted" style={{fontSize:13}}` across 21 templates → `.meta-line`** (inline-style dup eliminated app-wide). `<MetaLine items>` component (auto ` · ` separators, falsy-filtered) proven on carlog's joined text run. `tsc`+`build` green. _Optional later: convert remaining single-line `.meta-line` divs to `<MetaLine>`; 4 non-standard `fontSize:13` cases (a `<strong>`, danger `<p>`s, one reversed-prop line) left as-is._ |
| 7 | ~~**`EmptyState`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/EmptyState.tsx` (wraps existing `.empty` token, backward-compatible; `icon`/`title`/`action` slots). **All 42 `<div className="empty">` across 28 files migrated → `<EmptyState>`; zero `className="empty"` remain** (engine `CollectionView`/`DeclarativeApp`/`ProfilePicker` + 25 builtin sites). `tsc`+`build`+`qa:schema-ui` (0 issues ×3) green. _Opportunistic later: add `icon`/`action` to solo-first first-run empties._ |
| 8 | ~~**`StatCard`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/StatCard.tsx` (label + big value + sub + `tone`; `.stat-card__value` token). Migrated tripsplit + roomledger total headers (dropped inline `fontSize:28/700`). **Fixed the balance-row direction-color bug:** both `BalancesPanel`s' rows → `RecordRow` + **signed** `MoneyAmount`, so "owes" now renders red (was green via `Math.abs`). `tsc`+`build` green. _Follow-up: groupfund's centered 32px total + carpool count are a hero variant — add `align`/`size` to StatCard or a Hero brick later._ |
| 9 | ~~**`SectionHeader`**~~ ✅ DONE | — | ✅ **Shipped 2026-06-13** — `kit/SectionHeader.tsx` (`title` + optional `count` + trailing `action`; `.section-header` tokens). **Migrated all 5 title+action header rows** — choreboard KidView + ParentView ×2, scorepad MainView, engine `CollectionView` (every declarative room). Bare `.section-title` (106×) stays as the shared class (no churn). `tsc`+`build`+`qa:schema-ui` (0 issues ×3) green. |
| 10 | ~~**`ListCard` shell**~~ ⛔ SUPERSEDED | — | **Declined 2026-06-13** — `RecordRow` (#1, shipped) already _is_ the `card row gap-sm` container with `leading`/`title`/`meta`/`trailing` slots. A bare `<div className="card row gap-sm">{children}</div>` wrapper would dedupe nothing over the already-shared classes (zero reuse×pain). Non-record rows stay as the plain class. |
| — | **Kit purity: relocate `format.ts`** | `@/templates/choreboard/lib/format` → `@/lib/format` | ✅ **Done 2026-06-13** — moved the generic formatter module (`formatMoney`/`formatDate`/`CURRENCY_OPTIONS`/`weekdayName`) out of choreboard's lib to neutral `src/lib/format.ts`; repointed all 24 importers. **The kit (`MoneyAmount`/`SplitView`) no longer reaches into a template** for formatting. Clears the #2 follow-up. |

### Tier 3 — engine convergence

| # | Work | Why |
|---|------|-----|
| 11 | Make `RecordCard` (declarative engine) render through the same Tier-1 kit (`RecordRow`, `MoneyAmount`, `PersonChip`) | Declarative and builtin rooms become visually identical; one fix touches both worlds |
| 12 | Audit existing shell bricks (`AddPersonByName`, `ClaimProfile`, `SwitchProfile`, `ConfirmModal`, field bricks) against the rubric | They're already shared — verify they're *perfect*, not just present |
| 13 | Promote a new field type / brick whenever `/next-room` hits a wall | Keeps the library growing with real demand |

**Kit reference doc — ✅ Shipped 2026-06-13:** `docs_and_changelog/html/rooms/kit.html` (manifest `rooms-kit`, nav added to every page) documents all 9 bricks — props contract, what each replaces, the `globals.css` tokens. **Satisfies rubric point 10 (Documented) across the whole kit.** _Follow-up: 3 template doc pages (choreboard/tripsplit/bookclub) drifted from earlier brick migrations — sync via `html-docs` next._

---

## Worked example — iteration 1 (the tripsplit card)

So the loop has a concrete start. **Unit: `RecordRow` + `MoneyAmount` + `PersonChip`.**

**Before** (`tripsplit/components/TripView.tsx:94-102`):
```
[Avatar]  Dinner at Joe's                              €84.00
          2024-06-10 · Alex paid · split: Bob, Charlie
```
All facts equal-weight, payer buried mid-sentence, amount detached from Alex, split
is an unstructured comma list.

**After** (target):
```
[Alex●]  Dinner at Joe's                    Alex paid · €84.00
         Jun 10   ·   split 3 ways          ↳ Bob €28 · Charlie €28
```
- Payer's avatar + amount visually bound ("**Alex paid €84.00**" as the dominant
  trailing block).
- Description is the title.
- Meta is a structured `MetaLine` (date, split count) — not a sentence.
- Split renders as `PersonChip`s with each person's share, optionally collapsible.

Build `MoneyAmount`, `PersonChip`, `Avatar` in `src/components/kit/`, compose them
into `RecordRow`, migrate tripsplit, then roomledger/groupfund/coparent, delete their
`ui.tsx` copies, point `RecordCard` at the same primitives, QA, ship.

---

## Definition of done (per brick)

- [ ] Passes all 10 rubric points
- [ ] Every consumer migrated; per-template copies deleted
- [ ] `npm run build` clean; `qa:schema-ui` clean if schema touched
- [ ] Eyeballed in `/run` (≥1 builtin + the declarative engine)
- [ ] HTML docs synced (`html-docs`); backlog row retired (`rice-backlog`)
- [ ] Committed, pushed, redeployed
