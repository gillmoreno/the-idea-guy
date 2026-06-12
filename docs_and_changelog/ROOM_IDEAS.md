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
- [x] **Lend & Borrow** 🔁 — who borrowed what: item, who has it, due back, returned · declarative · 2026-06-12. Pure catalog entry (member status out → returned).
- [x] **Packing List** 🧳 — shared trip packing: claim what you'll bring, no duplicates · declarative · 2026-06-12. Pure catalog entry (claim status + attribution chip).
- [x] **Moving Day** 📦 — box inventory (photo of contents) + claimable moving tasks · declarative · 2026-06-12. First catalog template with two collections and an image field.
- [x] **Plant & Pet Sitter** 🪴 — care tasks while away: mark done with photo proof, owners see who & when · declarative · 2026-06-12. New shared brick: **relative time on attribution chip** ("Anna · 2h ago", `src/lib/relativeTime.ts`) — every status change now answers "when?".
- [x] **Roommate Ledger** 🏠 — household bills & shared purchases: who paid, who owes, settle up · builtin · 2026-06-12. Beyond Trip Split: expense categories, month-grouped history, and **recordable settle-up payments** (Mark paid → settlement entry, balances actually clear). New shared brick: **`src/lib/splitMath.ts`** — settlement math promoted out of tripsplit (tripsplit now re-exports it).
- [x] **Who's In?** 🙋 — recurring event headcount: In/Maybe/Out per date, capacity + first-come waitlist (RSVP keeps original response time so flipping maybe → in doesn't jump the queue), history of past turnouts · builtin · 2026-06-12.
- [x] **Gift Plan** 🎁 — gift ideas for one person: vote, claim the buy, mark bought & wrapped (recipient simply not invited; E2E keeps the secret) · declarative · 2026-06-12. Pure catalog entry (votes + claim status).

## Candidates (pick the highest value ÷ effort)

- [ ] **Carpool Rota** 🚗 — school-run / commute driving rotation: whose turn, swaps, fairness counter. Builtin (rotation logic).
- [ ] **Secret Santa** 🎁 — draw names privately, wishlists, budget. Builtin (private assignment needs crypto/per-member secrets).
- [ ] **Game Night** 🎲 — running scoreboard across game nights, win streaks, who hosts next. Builtin (scores/streak math, like Fit Crew).
- [ ] **Meal Week** 🍽️ — plan the week's dinners together: propose meals, assign cook per day, auto-derive shopping notes. Builtin or declarative.
- [ ] **Care Circle** ❤️ — siblings coordinating care for a parent: visits, meds picked up, doctor notes, "who's on this week". Builtin (sensitive — lean on E2E story).
- [ ] **Dose Log** 💊 — shared medication log for a kid/parent/pet: tap to log a dose, see who gave it and when — no double-dosing. Builtin (event log; strong E2E health story).
- [ ] **Babysitter Handoff** 👶 — standing instructions (bedtime, allergies, emergency contacts) + a day log between parents and sitter. Declarative (two collections; E2E for kid data).
- [ ] **Cabin Calendar** 🏔️ — co-owned vacation home: claim weekends/weeks, see who's up next, no double-booking. Builtin (date-range claims).
- [ ] **Emergency Vault** 🚨 — family's critical info in one E2E place: doctors, policy numbers, allergies, blood types. Declarative (records; E2E is the whole point).
- [ ] **Freezer Stash** 🧊 — household freezer/pantry inventory: what's in there, use-by, claim "I'll cook it". Declarative (status).

## Parked

_(none yet — when an idea is rejected, move it here with one line on why)_
