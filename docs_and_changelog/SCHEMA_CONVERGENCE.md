# Schema Convergence — porting the built-ins to data

**Goal:** collapse the **two architectures** into one. Every room becomes a
`RoomSchema` (data) rendered by the **one declarative engine** (`src/schema/engine/`),
and the bespoke built-in templates (`src/templates/*`) are deleted. This loop ports
them **one app at a time** until none remain, then does the architectural removal.

This doc is the loop's contract and memory (sister to `BRICK_POLISH.md` /
`ROOM_IDEAS.md`). Read it before doing anything. Strategy/rationale lives in
`docs_and_changelog/architecture-convergence.html` ("One Engine").

---

## Why this loop exists

Rooms grew two worlds: **(A)** 21 hand-written built-in templates — bespoke React +
own `XyzStore` + own Yjs shape, wired via a hardcoded `switch` in `TemplateApp.tsx`;
**(B)** the declarative engine — renders any schema JSON, versioned, forward-compatible
(unknown brick types are *skipped, never executed*). Two worlds = fix-bugs-N×, drift,
and a big regression surface (the expense-card bug hit 5 templates at once). Convergence
makes each room a JSON object over one tested engine: fix once, can't drift, and it
unlocks AI mid-app editing (a schema diff, not a code rewrite).

**The rule:** porting an app is not done until the live room renders through the engine
and the bespoke code is provably dead. Writing a schema without retiring the built-in
makes the two-worlds problem worse, not better.

---

## Ground rules (decided 2026-06-13)

- **All existing rooms are disposable** (pre-release; one real room — the trip — with
  ~5 data points). **No on-device CRDT migration adapters.** A port = author schema →
  verify parity → flip the registry to the engine → (dead bespoke code removed in the
  final cleanup pass).
- **Prerequisite before deleting *any* built-in: the Export brick must ship.** A
  room-data **Export to JSON/CSV** so the few real data points survive. Export only —
  an import/recreate mechanism is **not** required. (See queue item E0.)
- **Additive-first & forward-compat.** New engine field/feature types are added so old
  rooms ignore unknowns (`engineSupportsSchema`/`migrate.ts`). Never reinterpret a
  stored field — that is the one irreversible surface (encrypted data lives on devices
  forever).
- **Capability before deletion.** If the engine can't yet express an app, the port's
  first half is *growing the engine* (new field/feature type, reusing the existing
  presentational kit bricks) — done the safe, tested way.
- **master only**, clean tree, one app per run, never leave the tree red.

---

## One iteration of the loop

Pick **one** app from the queue and carry it to "live on the engine".

1. **Preflight.** `git status` clean (commit unrelated WIP first as its own checkpoint;
   resume your own leftovers). Read this file; if an app is **In progress**, finish that
   one — skip to step 3.
2. **Pick.** Top of the queue (order below). Mark it **In progress** with today's date.
3. **Analyze the built-in.** Enumerate its data model (`templates/<app>/lib/types.ts` +
   `store.ts`), every view, every action, and any computed logic (settlement, fairness,
   totals). Produce a **parity checklist** — the bespoke app's capabilities, each a row.
4. **Capability gap.** For each field/feature the app needs, does the engine support it?
   Missing ones become engine work this run: add the type to `schema/types.ts`, render in
   `engine/RecordCard.tsx`, input in `engine/FieldInput.tsx`, layout in `schema/display.ts`,
   guard in `schema/migrate.ts`; **reuse the kit** (`MoneyAmount`, `SplitView`,
   `PersonChip`, `RecordRow`, `allocateShares`, …) for rendering. Add a `/schema/preview`
   gallery fixture for every new type.
5. **Author the schema.** Write the `RoomSchema` (collections, fields, features) and add
   it to the catalog (`public/catalog/v1.json`). Validate (`validateRoomSchema`).
6. **Parity check.** Render via the engine and walk the parity checklist row by row vs
   the built-in. Anything the schema can't do → either grow the engine or note the
   intentional difference. The app is portable only when parity holds.
7. **Flip.** Point the template id at the declarative engine (registry / `TemplateApp.tsx`).
   Leave the now-dead bespoke code on disk (removed in the final pass) — keeps each run
   small and the live app on exactly one implementation.
8. **QA gate.** From `apps/rooms/web`: `npx tsc --noEmit`, `npm run build`,
   `npm run qa:schema-ui` (schema touched). Eyeball via `/run`: the ported room + one
   other declarative room. Fix until green.
9. **Record / commit / deploy.** Update this ledger (mark ported; log engine capabilities
   gained). Commit `[port-room] <App>: ported to schema · +<engine types>`. Deploy
   `./deploy/rooms/redeploy.sh`, verify healthz. Sync docs (`html-docs`) if budget.
10. **Report.** What ported, engine types added, QA status, live URL, next in queue.

When the queue is empty → **final removal pass**: full quality check, then delete all
bespoke `templates/*` dirs + their stores + the `switch` in `TemplateApp.tsx`, leaving
the engine (+ any named, justified engine-exempt apps). One big architectural commit.

---

## Parity rubric (per app)

An app is "ported" only when:

- [ ] Every capability in the parity checklist works through the engine (or is a noted,
      accepted difference)
- [ ] Solo-first preserved: creator alone reaches the core action; people via
      `AddPersonByName`; records proxy-attributable, agency identity-bound
- [ ] Empty/loading/unknown states present (engine defaults or schema-provided)
- [ ] New engine types have `/schema/preview` fixtures + pass `qa:schema-ui` ×3 themes
- [ ] Registry flipped to the engine; live app renders the schema version
- [ ] `tsc` + `build` clean; committed, deployed
- [ ] Ledger updated

---

## The queue

Ordered to build the highest-value engine capability first (money), then numbers, then
the hard agency apps last. Each row notes the **engine capability** the port requires.

### E0 — Prerequisite brick (do before any deletion)

| # | Item | Notes |
|---|------|-------|
| E0 | **Export brick** — export a room's data to **JSON + CSV** | ✅ **DONE (2026-06-13)** — `src/shell/ExportData.tsx` (+ `src/lib/roomExport.ts` snapshot/CSV-flatten, `src/lib/downloadFile.ts`). Generic over any room via `Y.Doc.toJSON()` — zero template-specific code. JSON = lossless backup; CSV = best-effort flatten of record-like collections (opens in Excel/Sheets). Mounted **once** in `RoomInviteSettings` (admin area, before `RoomDangerZone`) → appears in every builtin **and** declarative room. Export only; no import (by design). `tsc` green. _Admin-gated for now (it's the whole dataset); could open to all members later._ |

### Tier 1 — money cluster (build `money` field + `split`/balance feature)

| # | App | Engine capability needed | Status |
|---|-----|--------------------------|--------|
| 1 | **tripsplit** 🧳 | `money` field type · `split`/balance feature (settlement). Kit bricks exist (`MoneyAmount`/`SplitView`/`allocateShares`) — wire them as engine types. | ⏳ **In progress (2026-06-13)** — first port |
| 2 | roomledger 🏠 | reuse `money` + `split` | todo |
| 3 | groupfund 🎯 | `money` + goal/total aggregate | todo |
| 4 | coparent 👪 | `money` + schedule (date); partial agency | todo |
| 5 | sitcoop 🍼 | `money`/hours balance + fairness | todo |

### Tier 2 — dates & RSVP (build `date` field + `rsvp` feature)

| # | App | Engine capability needed | Status |
|---|-----|--------------------------|--------|
| 6 | whosin 📅 | `date` · `rsvp`/headcount feature | todo |
| 7 | bookclub 📚 | `date` · votes (have) | todo |
| 8 | cabincal 🛖 | `date`/date-range claim feature | todo |
| 9 | supperclub 🍲 | `date` · rotation/fairness | todo |
| 10 | carecircle 🩺 | `date` · log list | todo |
| 11 | doselog 💊 | `date`/time log | todo |
| 12 | symptomdiary 📔 | `date`/time log | todo |
| 13 | carlog 🚗 | `date` · log list | todo |

### Tier 3 — numbers & leaderboards (build `number` field + `leaderboard` aggregate)

| # | App | Engine capability needed | Status |
|---|-----|--------------------------|--------|
| 14 | scorepad 🔢 | `number` · per-round totals | todo |
| 15 | gamenight 🎲 | `number` · leaderboard | todo |
| 16 | fitcrew 💪 | `number` · streak/leaderboard | todo |
| 17 | bracket 🏆 | knockout progression feature | todo |

### Tier 4 — fairness / counters

| # | App | Engine capability needed | Status |
|---|-----|--------------------------|--------|
| 18 | carpool 🚙 | fairness counter ("whose turn") | todo |
| 19 | backlog 🗳️ | **already expressible** (text + votes) — easy parity check | todo |

### Tier 5 — agency (hardest, do last; may stay engine-exempt)

| # | App | Engine capability needed | Status |
|---|-----|--------------------------|--------|
| 20 | choreboard 🧹 | roles + approval + gated-agency (PIN/HMAC, dual public/admin docs). Decide: grow the engine, or keep as a *named, justified* engine-exempt app with its own tests. | todo |

`practicelog` exists in `templates/` without a registry entry — confirm it's dead and
remove in the final pass.

---

## Engine capability ledger

Track the field/feature types the engine gains, so later ports reuse them.

| Capability | Kind | Added by | Reuses kit | Status |
|------------|------|----------|-----------|--------|
| `money` | field type | tripsplit port | `MoneyAmount` | ⏳ |
| `split` / balance | feature | tripsplit port | `SplitView`, `allocateShares` | ⏳ |
| `date` | field type | tier 2 | — | todo |
| `rsvp` | feature | whosin | — | todo |
| `number` | field type | tier 3 | — | todo |
| `leaderboard` | feature | tier 3 | — | todo |

---

## Definition of done (whole project)

- [ ] Export brick shipped (JSON/CSV) — data safety net
- [ ] All 20 built-ins ported to schemas and live on the engine
- [ ] Final removal pass: bespoke `templates/*` + stores + `switch` deleted; only the
      engine (+ any named engine-exempt apps) remain
- [ ] One-world: a single render path; docs (`architecture-convergence.html`) updated to
      "done"
