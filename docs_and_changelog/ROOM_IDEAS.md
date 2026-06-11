# Room ideas ledger

Working memory for the `/next-room` loop. Every idea ever considered lives here so the
loop never re-brainstorms the same thing twice. Statuses: **shipped**, **building** (WIP —
at most ONE at a time), **candidate**, **parked** (decided against, keep the reason).

A room is a small, shared, local-first utility for a specific group of people and a
specific recurring coordination problem. See `.claude/skills/next-room/SKILL.md` for the
full definition of what qualifies.

## Building (max 1 — finish before starting anything new)

_(empty)_

## Shipped

- [x] **ChoreBoard** 🧹 — family chores & allowance · builtin · pre-loop
- [x] **Trip Split** ✈️ — split trip costs, who paid / who owes, settle up · builtin · pre-loop
- [x] **Book Club** 📚 — pick books, set meetups · builtin · pre-loop
- [x] **Backlog** 💡 — propose & vote on ideas (owner-only) · builtin · pre-loop
- [x] **Fit Crew** 🏃 — workout league with streaks · builtin · pre-loop
- [x] **Potluck** 🥗 — who brings what, dietary tags · declarative · pre-loop
- [x] **Idea Pool** 💡 — propose & vote, generic backlog · declarative · pre-loop
- [x] **Grocery Run** 🛒 — shared shopping list: add items, claim "I'll grab it", mark bought · declarative · 2026-06-11. New shared brick: **status attribution** — schema engine records who last set a record's status (`statusById`/`statusAt`), shows a member chip on the card, and non-setters now see a read-only status pill (benefits Potluck & Idea Pool too).
- [x] **Appointment Huddle** 📅 — propose time slots, vote on availability, organizer confirms one · declarative · 2026-06-11. Pure catalog entry (votes + owner status), no engine changes.
- [x] **Watch Club** 🍿 — propose movies/series, vote what's next, track queue → watching → watched · declarative · 2026-06-11. Pure catalog entry (votes + member status).

## Candidates (pick the highest value ÷ effort)

- [ ] **Roommate Ledger** 🏠 — recurring household bills & shared purchases; Trip Split for daily life. Likely builtin (settlement math, can reuse `tripsplit/lib/balances.ts`).
- [ ] **Who's In?** 🙋 — recurring event availability: Sunday football, weekly poker — who's coming this week, headcount, waitlist. Declarative-ish; builtin if per-occurrence logic needed.
- [ ] **Carpool Rota** 🚗 — school-run / commute driving rotation: whose turn, swaps, fairness counter. Builtin (rotation logic).
- [ ] **Secret Santa** 🎁 — draw names privately, wishlists, budget. Builtin (private assignment needs crypto/per-member secrets).
- [ ] **Plant & Pet Sitter** 🪴 — watering/feeding schedule while someone is away: tasks, photos as proof, last-done timestamps. Declarative + image field.
- [ ] **Moving Day** 📦 — box inventory (what's in box #12), claim carrying tasks, address/utility checklist. Declarative (two collections).
- [ ] **Game Night** 🎲 — running scoreboard across game nights, win streaks, who hosts next. Builtin (scores/streak math, like Fit Crew).
- [ ] **Lend & Borrow** 🔁 — who borrowed what among friends/neighbors (books, tools, cash): item, due back, returned. Declarative (status: out → returned).
- [ ] **Meal Week** 🍽️ — plan the week's dinners together: propose meals, assign cook per day, auto-derive shopping notes. Builtin or declarative.
- [ ] **Packing List** 🧳 — shared trip packing: who brings the tent/speaker/first-aid, don't duplicate. Declarative (claim status) — pairs with Trip Split.
- [ ] **Care Circle** ❤️ — siblings coordinating care for a parent: visits, meds picked up, doctor notes, "who's on this week". Builtin (sensitive — lean on E2E story).

## Parked

_(none yet — when an idea is rejected, move it here with one line on why)_
