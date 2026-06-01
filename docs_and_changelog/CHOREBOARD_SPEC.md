# ChoreBoard — family chores & allowance app

> First mini-app built on the [Local-First Kit](./LOCAL_FIRST_KIT.md).
> Working name; easy to change.

Framed through the Idea Guy four-step lens.

## 1. The problem

Organizing kids to do chores — and turning that into a fair, motivating allowance — is messy:
- No shared, agreed-upon list of which chores exist or what each is "worth."
- No easy way for kids to see what they can do and watch their money grow.
- Parents lose track of what was actually done across the week.
- Payday becomes guesswork ("how much do I owe you?") instead of a clear total.

## 2. How it's solved today (and where it falls short)

- **Paper chore charts / whiteboards** — get erased, no running money total, not on the kid's phone.
- **Spreadsheets** — flexible but joyless for kids, no approval flow, not real-time across devices.
- **Existing allowance apps** — most are cloud SaaS that hold your family's data on their servers, often with subscriptions and ads. Poor fit for "own your own data."

## 3. The better approach (ChoreBoard)

A **local-first PWA**: a delightful, phone-friendly chore + allowance tracker where the **family owns its data** (synced end-to-end-encrypted across the kids' and parent's phones via the Local-First Kit). No cloud holding your kids' info, no subscription required to use it.

## 4. Teach it publicly

The whole journey — problem, the local-first architecture decision, the build, the lessons — documented here and on the Idea Guy site.

---

## Core concepts (data model)

All stored in one CRDT document per family (synced via the kit).

- **Family**: `id`, `name`, `currency` (configurable, **default `USD` / $**), `paydayWeekday` (e.g. Sunday), `inviteCode` (derives sync/encryption key).
- **Member**: `id`, `name`, `role` (`parent` | `kid`), `color`/avatar, optional `pin` (to pick own profile on a shared device).
- **Chore** (catalog entry): `id`, `title`, `description`, `category` (bedroom | bathroom | laundry | kitchen | living-room | general), `difficulty` (`very-easy` | `easy` | `medium` | `hard` | `tough`), `reward` (**one price per chore, same for all kids**), `recurrence` (`anytime` | `daily` | `weekly` | `one-off`), `requiresApproval` (bool), `status` (`active` | `proposed` | `archived`), `proposedBy` (member id, when a kid suggests it).
- **Completion** (log entry): `id`, `choreId`, `memberId`, `date`, `kind` (`reward` | `penalty`), `status` (`pending` | `approved` | `rejected` | `paid`), `amountSnapshot` (signed: positive reward, negative penalty, captured at completion time), `note`, `approvedBy`.
- **Penalty/adjustment**: modeled as a `Completion` with `kind: penalty` and a negative `amountSnapshot` (parent-applied), so balances and payday totals net out automatically.
- **Payment** (payday record): `id`, `memberId`, `periodStart`, `periodEnd`, `total`, `completionIds[]`, `status` (`owed` | `paid`), `paidDate`.

### Seed catalog (sensible defaults, editable)
Difficulty → example reward (placeholder currency):
- Very easy: make bed (0.50), feed pet (0.50)
- Easy: tidy own room (1.00), set/clear table (1.00)
- Medium: clean bathroom (3.00), tidy living room (2.00)
- Hard / multi-step: full laundry cycle — wash → hang/dry → fold → put away (4.00)

## Key flows

1. **Parent setup** — create family, set payday + currency, add kids, build/edit the chore catalog with prices & difficulty (pre-seeded with the defaults above), share an invite code/QR to add each phone.
2. **Kid daily use** — pick profile (optional PIN) → see available chores (filter by difficulty/category) → tap "Done" → creates a `pending` completion. Always-visible **running balance** and **"this week so far."**
3. **Approval** (only for chores with `requiresApproval`) — parent reviews the queue, approves/rejects. Approved completions count toward the balance.
4. **Calendar / history** — per kid, a calendar of what was done each day with daily/weekly totals.
5. **Payday** — on `paydayWeekday`, app shows **owed per kid** for the period. Parent taps "Mark paid" → archives those completions into a `Payment`, resets the running period. Payment history view.
6. **(Later) Gamification** — streaks, badges, savings goals.

## Screens

- **Profile picker** (shared-device friendly; each phone can also remember its member).
- **Kid dashboard** — balance, this-week total, available chores, one-tap "Done."
- **Chore catalog** (parent) — CRUD chores, prices, difficulty, categories.
- **Approvals** (parent) — pending queue.
- **Calendar / history** (per kid).
- **Payday / payments** (parent) — owed totals, mark paid, history.
- **Settings** — family, payday, currency, members, sync invite code/QR.

## Tech stack

- **Frontend**: Next.js 15 static export + React 19, plain CSS (matches existing site conventions), PWA (manifest + service worker).
- **Local-first layer**: Yjs + `y-indexeddb`, end-to-end-encrypted updates over the shared **Local-First Kit** relay (see kit doc).
- **Relay**: the shared thin Go WebSocket relay; self-hostable Docker image.
- **Distribution**: free hosted PWA (data on-device), self-host relay option, optional paid managed sync later.

## Build phases

- **Phase 0 — Local-First Kit MVP**: Next.js PWA shell + Yjs/IndexedDB persistence + encrypted WebSocket sync against a thin Go relay. Prove two devices sync conflict-free.
- **Phase 1 — ChoreBoard single-family core**: data model, parent setup, chore catalog (+ seed), kid dashboard with mark-done & running balance. Local only.
- **Phase 2 — Sync + multi-device**: family invite code/QR, profiles on multiple phones, real-time updates.
- **Phase 3 — Approvals, calendar, payday**: approval queue, history calendar, payday totals + payment history.
- **Phase 4 — Polish & distribution**: PWA install, beautiful UI, hosted deploy, self-host docs; (optional) gamification + paid managed sync.

## Decisions (locked for v1)
- **Currency**: configurable; **default USD ($)**.
- **Pricing**: one price per chore, same for every kid.
- **Penalties**: allowed (negative `Completion` entries applied by a parent).
- **Kid proposals**: kids can propose chores (`status: proposed`); a parent approves them into the active catalog.

## Open questions (later)
- Recurrence reset semantics (does a `daily` chore reappear each morning automatically?).
- Savings goals / interest as a gamification hook.
