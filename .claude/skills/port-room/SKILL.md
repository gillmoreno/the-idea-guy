---
name: port-room
description: >-
  One iteration of the schema-convergence loop: port one bespoke built-in room template
  into a declarative RoomSchema over the shared engine — growing the engine with any
  missing field/feature type (reusing the kit), verifying parity, flipping the registry
  to the engine, then QA, commit, deploy. Third sister loop to next-room and brick-polish.
  Designed to run on a recurring loop (e.g. /loop 30m /port-room). Use when the user says
  "next port", "port a room", "port to schema", or runs the convergence loop.
---

# Port room — one schema-convergence iteration

Each run ports **exactly one** built-in template into a `RoomSchema` rendered by the
declarative engine (or finishes the one in progress). The plan, queue, parity rubric, and
engine-capability ledger live in `docs_and_changelog/SCHEMA_CONVERGENCE.md` — **that file
is the loop's memory. Read it before doing anything.** Rationale is in
`docs_and_changelog/architecture-convergence.html`.

The mission: collapse the two architectures into **one**. Every built-in
(`apps/rooms/web/src/templates/*` — bespoke React + own Yjs store) becomes data (a schema)
over `src/schema/engine/`, and the bespoke code is eventually deleted. A port is not done
until the **live room renders through the engine**; authoring a schema without flipping the
template makes the two-worlds problem worse.

## Ground rules

- **master only** — no branches/worktrees. One app per run. Never leave the tree red.
- **Parallel-run (strangler-fig), never kill-on-faith.** Ship the declarative version
  **alongside** the bespoke one (distinct catalog id) so both are live and comparable.
  **Flip only after the user signs off on parity** — repointing the canonical id / retiring
  the bespoke is a separate deliberate step. Per-run work is therefore purely **additive**
  (new engine types + new catalog entry); the live built-in is never touched.
- **All rooms disposable** (pre-release) → **no CRDT migration adapters**; the Export brick
  (E0) + parallel-run are the safety net. Dead bespoke code is removed in the final pass.
- **Export brick (item E0) must ship before *any* built-in is deleted** — the data safety
  net. Don't start the final removal pass without it.
- **Additive & forward-compat:** new engine types must be ignorable by old rooms
  (`schema/migrate.ts`, `engineSupportsSchema`). **Never reinterpret a stored field.**
- **Reuse the kit:** new field/feature renderers compose existing bricks
  (`MoneyAmount`, `SplitView`, `PersonChip`, `RecordRow`, `allocateShares`, `Avatar`,
  `EmptyState`) — don't re-hand-roll UI in the engine.

## The iteration

### 0. Preflight
- `git status` clean. Commit unrelated WIP first as its own checkpoint; resume your own
  leftovers from a prior failed run.
- Read `SCHEMA_CONVERGENCE.md`. If an app is **In progress**, finish *that* — skip to step 3.

### 1. Pick one
Take the top of the queue (money cluster → dates → numbers → fairness → agency last). Mark
it **In progress** with today's date before writing code.

### 2. Analyze the built-in
Read `templates/<app>/lib/types.ts` + `store.ts` + the views. Write a **parity checklist**:
every data field, view, action, and computed behavior (settlement, fairness, totals, gates)
as rows. This is the contract the schema must meet.

### 3. Capability gap → grow the engine
For each field/feature the app needs that the engine lacks: add the type to
`schema/types.ts`, render it in `engine/RecordCard.tsx`, accept input in
`engine/FieldInput.tsx`, place it via `schema/display.ts`, and guard unknown-version in
`schema/migrate.ts`. **Compose kit bricks** for the visuals. Add a `/schema/preview`
gallery fixture for every new type so `qa:schema-ui` covers it.

### 4. Author the schema — alongside, not instead
Write the `RoomSchema` and add it to `public/catalog/v1.json` under a **distinct id** so it
coexists with the bespoke builtin (e.g. bespoke keeps `tripsplit`; schema entry is
`tripsplit-x` / "Trip Split (new engine)"). Confirm `validateRoomSchema` accepts it (invalid
schemas are dropped silently). **Do not touch the registry/`TemplateApp` switch** — the old
app stays live and untouched.

### 5. Parity check (parallel run)
Create **one of each** (bespoke + new schema room) and walk the checklist side by side.
Solo-first must hold (creator reaches the core action alone; `AddPersonByName`; proxy
records, agency identity-bound). Any gap → grow the engine or record an accepted difference.
Mark the app **Awaiting sign-off** in the ledger.

### 6. Do NOT flip — defer the cutover
The flip (repoint the canonical id, drop the bespoke from the picker) happens in a separate
step **only after the user confirms parity**; the bespoke code is deleted in the final pass.
A port run ends with both apps live. Never replace the built-in on the same run.

### 7. QA gate (do not deploy red)
From `apps/rooms/web`: `npx tsc --noEmit`, `npm run build`, and `npm run qa:schema-ui`
(schema always changes here). Eyeball via `/run`: the ported room + one other declarative
room. Fix until green.

### 8. Record, commit, deploy
1. Update `SCHEMA_CONVERGENCE.md`: mark the app ported, fill the engine-capability ledger.
2. Commit: `[port-room] <App>: schema version alongside builtin · +<engine types>`.
3. Deploy `./deploy/rooms/redeploy.sh` from repo root; verify the healthz line.
4. Docs: `html-docs` for the schema-engine/affected pages if budget; else leave the
   reminder — never skip deploy to write docs.

### 9. Report
What ported, engine types added, parity result, QA status, live URL, next in queue. If the
run couldn't finish, leave the app **In progress** with a note on where it stopped — the
next run resumes it — and report the blocker.

## Final removal pass (when the queue is empty)
Only after the Export brick (E0) has shipped. Full quality check across all rooms, then one
architectural commit: delete every bespoke `templates/*` dir + store + the `switch` in
`TemplateApp.tsx`, leaving the engine and any **named, justified** engine-exempt apps
(likely only choreboard). Update `architecture-convergence.html` to "done".

## Budget discipline
One app per run, sized to the interval. A big app (new engine type + schema + parity) may
span runs via the **In progress** state — but the tree must always typecheck and build at
the end of every run.
