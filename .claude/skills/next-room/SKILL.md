---
name: next-room
description: >-
  One iteration of the room factory: pick (or brainstorm) the next most valuable
  room idea for the Rooms app, build it end-to-end reusing shared components,
  grow the component library when a new brick is needed, then QA, commit, and
  deploy. Designed to run on a recurring loop (e.g. /loop 20m /next-room). Use
  when the user says "next room", "build the next room", or runs the room loop.
---

# Next room — one factory iteration

Each run ships **exactly one room** (or finishes the one in progress). The ideas ledger
at `docs_and_changelog/ROOM_IDEAS.md` is the loop's memory; `ANATOMY.md` (next to this
file) is the authoring manual. Read both before doing anything.

## What counts as a room

A room is a **small, shared, local-first utility for a specific group with a specific
recurring coordination problem** — trips, household, car, kids, health appointments,
work, hobbies, events, neighbors. Think "the spreadsheet/group-chat-pinned-message this
group keeps reinventing", as an app. Qualities of a good room idea:

- **A group, not a single user** — value comes from 2+ people seeing the same state.
- **One job** — explainable in one sentence; setup in under a minute.
- **Privacy-friendly** — E2E encryption is a feature for it (money, family, health).
- **No backend smarts needed** — works as CRDT state synced through a dumb relay. No
  server-side scheduling, no external APIs, no notifications-or-it's-useless ideas.

It's fine if the idea "already exists" as a popular app (Splitwise, Bring!, doodle-style
scheduling) — a frictionless E2E-encrypted no-account version is the differentiator.

## The iteration

### 0. Preflight

- `git status` — if the tree has unrelated uncommitted changes, **stop and report**
  instead of mixing work into someone's WIP. (Leftovers from a previous failed run of
  this loop are yours: resume them.)
- Read `docs_and_changelog/ROOM_IDEAS.md`. If something is in **Building**, your job
  this run is to finish *that*, not start anything new. Skip to step 3.

### 1. Brainstorm (only when the candidate pool is thin)

If fewer than ~5 unbuilt candidates remain, refill the pool before picking:

- Brainstorm 5–10 new ideas across *different* life domains than recent ones. Optionally
  WebSearch for inspiration ("apps for roommates/parents/teams people wish existed",
  popular micro-utilities) — but filter hard through "what counts as a room" above.
- Dedupe against **every** section of the ledger, including Shipped and Parked.
- Append new candidates with the one-line format used in the file, including a guess at
  declarative vs builtin.

### 2. Pick one

Choose the candidate with the best **value ÷ effort**: how common/painful is the
problem, how well does E2E/local-first fit it, how much existing Lego it reuses.
Prefer declarative (minutes) over builtin (a session) when value is similar. Move it to
**Building** in the ledger (one line, with today's date) before writing code.

### 3. Build it

Follow `ANATOMY.md` strictly — kinds, file layout, registration points, store pattern,
hard rules (Yjs from room-kit only; dumb relay; invites in URL hash). Solve the problem
*well*, not minimally: sensible empty states, the obvious second feature (e.g. an
expense splitter needs settle-up, not just a list).

**Lego-brick rule:** reuse `src/components/`, `src/shell/`, and room-kit first. If the
room needs something genuinely new and reusable (a date-slot picker, a rotation widget,
a new schema field/feature type), build it as a shared brick in the shared location —
improving the library is as valuable as shipping the room.

**Uniformity convention:** bottom nav for 3–5 sections, a Settings tab with
`RoomInviteSettings` + `RoomDangerZone`, land on the useful screen. Deviate only when
the room genuinely doesn't fit the shape.

### 4. QA gate (do not deploy red)

From `apps/rooms/web`: `npx tsc --noEmit`, `npm run build`, and `npm run qa:schema-ui`
if `src/schema/` changed. For declarative rooms, confirm the template actually appears
on the create-room page (invalid schemas are dropped silently). Fix until green.

### 5. Record, commit, deploy

1. Update the ledger: move the idea to **Shipped** (`- [x] **Name** emoji — one-liner ·
   kind · YYYY-MM-DD`); note any new shared bricks created.
2. Commit everything (template + ledger) in one commit, message style:
   `[next-room] + <Room Name>: <one-liner> + <new bricks if any>`.
3. Deploy: `./deploy/rooms/redeploy.sh` from the repo root. Verify the healthz line.
4. Docs: the post-commit hook flags stale pages. If the run has budget left, run the
   `html-docs` skill scoped to the new template's page; otherwise leave the reminder
   for a docs pass — never skip the deploy to write docs.

### 6. Report

End with: what shipped (name + one-liner + kind), new bricks added to the library,
candidate pool size, and the live URL. If the run could NOT finish (build broken,
deploy failed), leave the idea in **Building** with a note on where it stopped — the
next iteration picks it up — and report the blocker clearly.

## Budget discipline

One room per run, sized to fit the loop interval. If a builtin idea is clearly too big
to finish in one run, either (a) pick a smaller candidate and park the big one with a
note, or (b) knowingly split it across runs via the **Building** state — but never leave
the tree broken: the tree must always typecheck and build at the end of a run, even if
the room ships in the next one.
