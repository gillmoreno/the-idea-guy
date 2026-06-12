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
- [x] **Care Circle** ❤️ — family caring for someone: one-tap visit log with "who's up next" (fairness brick), shared updates feed for doctor news; standing info in setup · builtin · 2026-06-12. Composes doselog event-log + carpool fairness + authored notes.
- [x] **Freezer Stash** 🧊 — freezer/pantry inventory: what's in there, use-by, photo for mystery containers, claim "I'll use it" · declarative · 2026-06-12. Pure catalog entry; completes the household food loop with Grocery Run + Meal Week.
- [x] **Cabin Calendar** 🏔️ — co-owned place: claim date ranges, clash blocking on add + ⚠️ red border on double-booked entries (offline CRDT races surface visibly), per-owner nights tally, "Free up" own bookings · builtin · 2026-06-12.
- [x] **Wedding Crew** 💍 — wedding-party HQ: claimable tasks ("I've got it") + shared day-of timeline · declarative · 2026-06-12. Pure catalog entry (two collections + claim status).
- [x] **Meal Train** 🍲 — post the nights a family needs dinner, friends claim "I'm bringing dinner", mark delivered · declarative · 2026-06-12. Pure catalog entry (claim status + attribution).
- [x] **Tournament Bracket** 🏆 — knockout night: shuffle-seed a bracket from selected players, tap winners (tap again to undo), byes auto-advance, champion banner + hall of champions · builtin · 2026-06-12. Bracket math is pure functions over a CRDT results map (`templates/bracket/lib/bracket.ts`) — unit-sanity-checked with byes.
- [x] **House Manual** 🏡 — host + co-host/cleaner HQ: supplies board (Stocked → Running low → I'll restock) + photo issue log (Open → I'm on it → Fixed) · declarative · 2026-06-12. Pure catalog entry (two collections, two status flows).
- [x] **Emergency Vault** 🚨 — family's critical info: policies, doctors, allergies, document photos — no status flows, just E2E records with author footers · declarative · 2026-06-12. The platform's purest E2E showcase.
- [x] **Shared Car Log** 🚙 — one shared car: one-tap "I've got the car" holder status, fill-ups with cost + odometer, service/repair notes with costs, day-grouped history, latest odometer at a glance · builtin · 2026-06-12.
- [x] **Campaign Log** 🐉 — tabletop party HQ: adventure journal with maps/handout photos + party loot with "I'm carrying it" claims · declarative · 2026-06-12. Pure catalog entry (two collections + claim status).
- [x] **Co-Parenting Hub** 👨‍👩‍👧 — two households, one calm place: "kids are with X today" banner, custody schedule via date-range stays (overlaps flagged ⚠️, not blocked — parents sort it out), shared updates feed · builtin · 2026-06-12. Composes cabincal date-ranges + carecircle notes.
- [x] **Kid Expenses — Co-Parenting Hub "Money" tab** 💶 — **user-requested** (Gil's real Excel): per-line ÷2 (shared) / ÷1 (other owes all) splits, month navigation, per-parent counted totals → expenses net → fixed monthly support (amount + direction + currency in config) → one final "X pays Y €Z", one-tap month settled (+ reopen) · builtin upgrade · 2026-06-12. Close math verified against the original spreadsheet (223.75 / 539.86 → net 316.11).

## Candidates (pick the highest value ÷ effort)


- [ ] **Team Snacks** ⚽ — kids' sports team parents: who brings snacks/washes kit each match, fairness rotation. Builtin (fairness brick) or declarative claim.
- [ ] **Co-op Order** 📦 — neighbors bulk-buy together: propose an order, claim items & quantities, settle later. Declarative (claim status); pairs with Roommate Ledger for money.
- [ ] **Street Notice** 🏘️ — a street's noticeboard: heads-ups (water shutoff, lost cat), offers, asks. Declarative (records + tags + author footer).
- [ ] **Allotment Crew** 🌱 — community garden plot: watering rota (fairness brick), tasks, harvest photo log. Builtin composing existing bricks.
- [ ] **Co-Parenting Hub** 👨‍👩‍👧 — separated parents: handoff calendar, kid info, shared notes. Builtin (sensitive — E2E story strong; custody schedule is the core mechanic).
- [ ] **Study Crew** 📖 — exam prep group: topics list with "I'll summarize" claims, shared questions. Declarative (claim status).
- [ ] **Setlist** 🎵 — band/choir: propose songs, vote, track rehearsed → performance-ready. Declarative (votes + status; Watch Club mechanics for music).

## Parked

- **Secret Santa** 🎁 — parked 2026-06-12: rooms share one encryption key, so every member can read all room data; truly private assignments need per-member encryption channels that room-kit doesn't have. Revisit if/when room-kit grows per-member secrets.
