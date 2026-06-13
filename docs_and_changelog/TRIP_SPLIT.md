# Trip Split — group expense splitting for trips

**Date:** 2026-06-07  
**Status:** v1 shipped in `apps/rooms/web/src/templates/tripsplit/`  
**Inspiration:** [Splitwise](https://play.google.com/store/apps/details?id=com.Splitwise.SplitwiseMobile) — shared costs, who paid, who owes whom.

---

## What it does

Trip Split is the second **Rooms** template (after ChoreBoard). Friends on a trip create a room, add travelers, log shared expenses, and see balances plus minimum settlement transfers.

| Splitwise concept | Trip Split v1 |
|-------------------|---------------|
| Group | Room (invite code) |
| Friends | Travelers (set up at create) |
| Expense | Description, amount, payer, split (equal or by per-person shares) |
| Balances | Net per person + simplified debts |
| Settle outside app | Shown as “X owes Y $Z” — Venmo/cash/etc. |

**Local-first:** Same as all Rooms — Yjs CRDT on devices, E2E encrypted sync via the shared relay. No server-side expense database.

---

## Create & join

1. **Create** → pick **Trip Split** → name the trip → add travelers (min 2).
2. **Share** the room code; friends **Join** from the Rooms home screen.
3. Each device picks **who’s on this device** (profile picker).
4. Anyone can **add, edit, or delete expenses** (tap an expense to edit) and view **balances**.

Organizer = room owner with admin secret (same shell model as ChoreBoard).

---

## Data model (`template.tripsplit.*`)

Public Yjs branch only in v1 (no admin-only trip data yet).

```
template.tripsplit.trip       → { name, currency, createdAt }
template.tripsplit.travelers  → Map<id, { id, name, color, joinedAt }>
template.tripsplit.expenses   → Map<id, { description, amountCents, paidById, splitAmongIds, shares?, date, … }>
                                 # shares?: { travelerId: weight } — present only when the split is uneven
```

Amounts stored as **integer cents** to avoid float drift.

---

## Balance math

1. For each expense, `allocateShares` (in `src/lib/splitMath.ts`) splits `amountCents` across `splitAmongIds` in proportion to the optional `shares` weights — defaulting to weight 1 each, i.e. an equal split. Leftover cents use the largest-remainder method so totals sum exactly.
2. Each non-payer’s share reduces their net balance; payer’s net increases by that share.
3. **Simplify debts:** greedy match creditors and debtors for minimum “A owes B” lines (Splitwise-style).

---

## v1 limits (intentional)

- Splits support per-person **shares** (equal by default); no percentage or exact-amount entry.
- Single currency per trip.
- No recorded settlements (balances are computed from expenses only).
- No expense categories or receipts.

---

## Files

| Path | Role |
|------|------|
| `templates/tripsplit/lib/store.ts` | Yjs CRUD (add / update / remove expense) |
| `src/lib/splitMath.ts` | `allocateShares` + net balances + debt simplification (shared) |
| `templates/tripsplit/lib/balances.ts` | Re-export of the shared split math |
| `templates/tripsplit/TripSplitApp.tsx` | Shell: loading, setup, profile, main |
| `templates/tripsplit/components/*` | Setup, expenses, balances UI |
| `templates/registry.ts` | Template picker entry |
| `templates/TemplateApp.tsx` | Routes `templateId` → template UI |

---

## Next templates (planned)

From [ROOM_KIT_ARCHITECTURE.md](./ROOM_KIT_ARCHITECTURE.md): **Book Club** and further Trip Split enhancements (unequal splits, settlements, add traveler mid-trip).
