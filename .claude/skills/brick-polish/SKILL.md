---
name: brick-polish
description: >-
  One iteration of the component-quality loop: take the top brick from the queue,
  audit it against the rubric, perfect it in the shared kit, migrate every consumer
  and delete the duplicated copies, then QA, commit, and deploy. Sister loop to
  next-room. Designed to run on a recurring loop (e.g. /loop 30m /brick-polish). Use
  when the user says "next brick", "polish a brick", or runs the brick loop.
---

# Brick polish — one component-quality iteration

Each run perfects **exactly one brick** (or finishes the one in progress). The plan,
rubric, and prioritized queue live in `docs_and_changelog/BRICK_POLISH.md` — that file
is the loop's memory. **Read it before doing anything.**

The mission: collapse the 20 bespoke `src/templates/*/components/ui.tsx` files and the
declarative engine into **one shared presentational kit** at
`apps/rooms/web/src/components/kit/`. Every iteration moves one pattern into the kit,
makes it pass the rubric, and **deletes the copies**. Adding a shared component without
deleting the duplicates makes things worse, not better — migration is the load-bearing
step.

## The iteration

### 0. Preflight

- **This loop works on `master` only** — no branches, no worktrees. It owns the working
  tree; every brick commit lands directly on `master` and is pushed.
- `git status` — the tree should start clean. If there is *unrelated* pending work, don't
  stop and don't fold it into the brick commit: **commit it first as its own checkpoint**
  (group by coherent feature, never discard real source) so you begin from a clean
  `master`, then proceed. Leftovers from a previous failed run of *this* loop are yours:
  resume them.
- Read `docs_and_changelog/BRICK_POLISH.md`. If a brick is marked **In progress** in the
  queue, finish *that* one this run — skip to step 3.

### 1. Pick one brick

Take the top of the queue, ordered by **reuse × visual pain** (Tier 1 first). A unit is
either an existing brick to perfect or a duplicated pattern to extract into a new brick.
Mark it **In progress** in the queue (with today's date) before writing code.

If the queue is thin (<3 unbuilt items), refill it first: grep for newly-duplicated
patterns (repeated symbols across `templates/*/components/ui.tsx`, repeated card JSX,
ad-hoc `.muted` meta lines) and append them to the appropriate tier.

### 2. Audit

Find **every** consumer of the pattern — grep the duplicated symbol (e.g. `MoneyCents`,
`Avatar`) or the repeated JSX shape across all templates and the engine. Score the
current state against the 10-point rubric in the plan doc. Write the gap as a short
before/after (the plan's iteration-1 example is the model).

### 3. Design & build in the kit

Decide the canonical component + a typed, presentational props contract (plain data in,
no room-specific logic). Build it in `apps/rooms/web/src/components/kit/` (stateful shell
bricks go in `src/shell/` instead). Add CSS to `globals.css` using **only design tokens**
— no hardcoded hex, no magic spacing. Honor the rubric: scannable in <2s, visual
hierarchy not a text run, overflow-safe, accessible, `PersonChip`/proxy-aware, defined
empty/loading/unknown states.

### 4. Migrate every consumer (the point of the whole loop)

Replace each duplicate with an import of the kit brick. **Delete** the per-template copy.
Point the declarative engine's `RecordCard` at the same primitive so builtin and
declarative rooms render identically. The run is not done while any duplicate of this
pattern still exists in the tree.

### 5. QA gate (do not deploy red)

From `apps/rooms/web`: `npx tsc --noEmit`, `npm run build`, and `npm run qa:schema-ui`
if `src/schema/` changed. Use the project's `/run` to eyeball the affected rooms — at
least one builtin (tripsplit for the money cluster) **and** a declarative room, since the
engine now shares the brick. Fix until green.

### 6. Record, commit, deploy

1. Update `BRICK_POLISH.md`: mark the brick shipped, note which `ui.tsx` copies were
   deleted, and queue any new duplication the migration revealed.
2. Commit everything in one commit, message style:
   `[brick-polish] <Brick>: <what changed> · migrated <N> consumers, deleted <N> copies`.
3. Deploy: `./deploy/rooms/redeploy.sh` from the repo root. Verify the healthz line.
4. Docs: run the `html-docs` skill scoped to the affected pages if the run has budget;
   otherwise leave the post-commit reminder — never skip the deploy to write docs.

### 7. Report

End with: which brick shipped, how many consumers migrated and copies deleted, QA
status, the live URL, and the next item in the queue. If the run could **not** finish
(build broken, migration incomplete), leave the brick **In progress** in the queue with a
note on where it stopped — the next iteration resumes it — and report the blocker.

## Budget discipline

One brick per run, sized to the loop interval. If a brick has many consumers, it's fine
to migrate them across runs via the **In progress** state — but the tree must always
typecheck and build at the end of a run. Never leave it broken, and never leave a
half-migrated pattern where some templates use the kit and others still have copies for
an unrelated brick: finish the migration you started.
