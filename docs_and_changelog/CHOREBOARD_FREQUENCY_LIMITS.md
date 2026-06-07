# ChoreBoard — chore frequency limits

Kids can only mark a chore done a limited number of times per period. This stops repeat taps from stacking rewards.

## Defaults

- **New chores:** once per day (`{ maxCompletions: 1, period: "day" }`).
- **Seed chores:** daily/weekly chores get matching limits; former “anytime” chores stay unlimited (`maxCompletions: 0`).
- **Existing families** without `frequencyLimit` on a chore still use the legacy `recurrence` field:
  - `daily` → 1/day
  - `weekly` → 1/week
  - `one-off` → once ever
  - `anytime` → no limit

## Parent configuration

In **Chores → Add/Edit**, parents set:

- **Times** — how many completions allowed (1–99)
- **Per** — `day`, `week`, `month`, or `ever` (one-time)
- **No limit** — same as old “anytime”

## Enforcement

- Checked in `ChoreStore.markDone()` (server-side logic, not UI-only).
- Pending completions count toward the limit; rejected ones free a slot.
- Paid completions still count within the period (history only; balance already cleared).

## Kid UI

- ✓ button is disabled when the limit is reached.
- Subtitle shows e.g. “Done for today” or “2/3 this day”.

## Data model

```ts
interface ChoreFrequencyLimit {
  maxCompletions: number; // 0 = unlimited
  period: "day" | "week" | "month" | "ever";
}
```

Stored on `Chore.frequencyLimit` and synced via the public catalog.
