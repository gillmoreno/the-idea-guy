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
| 1 | **`RecordRow`** — the canonical "actor did X · amount" card: leading avatar, dominant title, **structured** meta (chips not a text run), trailing amount visually tied to the payer | tripsplit, roomledger, groupfund, coparent expense cards (all bespoke) | The exact bug. One card, every money room. |
| 2 | **`MoneyAmount`** — currency + sign + color (pos/neg) in one place | 20× `MoneyCents` copies in `templates/*/ui.tsx` | Same number, 20 renderers. |
| 3 | **`PersonChip`** — color dot + name, unknown-id fallback | `RecordCard` person field, tripsplit `BalancesPanel`, every "who" field | Make a person *look* the same everywhere. |
| 4 | **`Avatar`** (kit established ✅) | tripsplit copy only | ✅ **2026-06-13** — extracted `src/components/kit/Avatar.tsx` (+ `kit/index.ts` barrel). Props: `person:{name,color}` or scalar `name`/`color`, `large`, `title`; `aria-hidden` glyph + name tooltip, graceful `?` fallback. Migrated **20 consumers across 19 templates**, deleted **19** `Avatar` copies (incl. **16 now-empty `ui.tsx`** removed). `tsc`+`build` green. **tripsplit's copy (20th) is migrated on disk but excluded from the commit** — a concurrent split-math/edit-expense feature was mid-flight on `tripsplit/TripView.tsx`; its Avatar migration lands with that work or next run. **Finish tripsplit next iteration.** |
| 5 | **`SplitView`** — who-owes-whom as line items, not `split: a, b, c` | tripsplit/roomledger split + settle-up | The second half of the tripsplit clarity fix. |

### Tier 2 — structure & states (consistency across all rooms)

| # | Brick | Replaces | Why |
|---|-------|----------|-----|
| 6 | **`MetaLine`** — structured secondary line (date · category · attribution) with consistent separators & truncation | ad-hoc `.muted` lines in every template | Stop the "text run" anti-pattern at the source. |
| 7 | **`EmptyState`** — teaching empty state (icon, one-line what, primary action) | roomledger/sitcoop hand-rolled empties | Solo-first first-run clarity. |
| 8 | **`StatCard` / `Balance` row** — "gets back / owes" with direction color | tripsplit `BalancesPanel`, groupfund totals | Money summaries read at a glance. |
| 9 | **`SectionHeader`** — `.section-title` + optional action/count | scattered inline headers | Vertical rhythm. |
| 10 | **`ListCard` shell** — the `card + row + gap-sm` wrapper as one component | every template's row markup | The container half of #1. |

### Tier 3 — engine convergence

| # | Work | Why |
|---|------|-----|
| 11 | Make `RecordCard` (declarative engine) render through the same Tier-1 kit (`RecordRow`, `MoneyAmount`, `PersonChip`) | Declarative and builtin rooms become visually identical; one fix touches both worlds |
| 12 | Audit existing shell bricks (`AddPersonByName`, `ClaimProfile`, `SwitchProfile`, `ConfirmModal`, field bricks) against the rubric | They're already shared — verify they're *perfect*, not just present |
| 13 | Promote a new field type / brick whenever `/next-room` hits a wall | Keeps the library growing with real demand |

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
