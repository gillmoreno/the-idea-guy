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
- [x] **Babysitter Handoff** 👶 — house notes (bedtime, allergies, contacts) + photo day log between parents and sitter · declarative · 2026-06-12. New shared brick: **record author footer** — every record card now shows "Added by Anna · 2h ago" (createdById/createdAt were stored but never displayed; benefits all declarative rooms).
- [x] **Dose Log** 💊 — one-tap dose logging across caregivers: "last given 2h ago by Anna", optional min-interval warning (⚠️ + red border when under the gap), day-grouped history; med names snapshotted into events so history survives med deletion · builtin · 2026-06-12.
- [x] **Meal Week** 🍽️ — propose the week's dinners, vote, claim "I'll cook it", mark cooked · declarative · 2026-06-12. Pure catalog entry (votes + claim status + day tags).
- [x] **Carpool Rota** 🚗 — whose turn to drive: one-tap drive logging, fairness counter; "next up" derives from fewest-drives (tie → longest since last drive), so swaps need no mechanics — log reality and the rota self-corrects · builtin · 2026-06-12.
- [x] **Game Night** 🎲 — running scoreboard across game nights: log game + winners, standings with 🔥 win streaks, "who hosts next" via fairness rotation · builtin · 2026-06-12. New shared brick: **`src/lib/fairness.ts`** — generic fewest-events rotation extracted from carpool (both templates now share it).
- [x] **Shift Swap** 🔄 — post a shift you can't make, teammate claims "I'll cover it", mark covered; trade/sweetener field; author + claimer both visible via engine bricks · declarative · 2026-06-12. Pure catalog entry.

## Candidates (pick the highest value ÷ effort)

- [ ] **Secret Santa** 🎁 — draw names privately, wishlists, budget. Builtin (private assignment needs crypto/per-member secrets).
- [ ] **Care Circle** ❤️ — siblings coordinating care for a parent: visits, meds picked up, doctor notes, "who's on this week". Builtin (sensitive — lean on E2E story).
- [ ] **Cabin Calendar** 🏔️ — co-owned vacation home: claim weekends/weeks, see who's up next, no double-booking. Builtin (date-range claims).
- [ ] **Emergency Vault** 🚨 — family's critical info in one E2E place: doctors, policy numbers, allergies, blood types. Declarative (records; E2E is the whole point).
- [ ] **Freezer Stash** 🧊 — household freezer/pantry inventory: what's in there, use-by, claim "I'll cook it". Declarative (status).
- [ ] **House Manual** 🏡 — Airbnb host + co-host/cleaner: turnover checklist, supplies running low, guest notes. Declarative (two collections).
- [ ] **Team Snacks** ⚽ — kids' sports team parents: who brings snacks/washes kit each match, fairness rotation. Builtin (fairness brick) or declarative claim.
- [ ] **Co-op Order** 📦 — neighbors bulk-buy together: propose an order, claim items & quantities, settle later. Declarative (claim status); pairs with Roommate Ledger for money.
- [ ] **Wedding Crew** 💍 — wedding party coordination: tasks, who-brings, day-of timeline. Declarative (two collections + claim status).

## Parked

_(none yet — when an idea is rejected, move it here with one line on why)_
