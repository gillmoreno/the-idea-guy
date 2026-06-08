# Fit Crew

**Date:** 2026-06-07  
**Status:** v1 builtin shipped

---

## Hook

*Friend workout league — log sessions, chase streaks, weekly leaderboard, silly prizes.*

Strava-ish **for a small crew**, not a global network. Invite code, no accounts, E2E encrypted sync.

---

## Flows

1. **Create → Fit Crew** → name crew + ≥2 members
2. **Share** room code — each friend picks their profile on their phone
3. **Log workout** — activity, optional minutes/note/proof photo
4. **Leaderboard** — workouts this week + live streak count
5. **Prizes** — anyone adds stakes; award to a member when earned

---

## Data model (`template.fitcrew.*`)

```
template.fitcrew.crew    → { name, createdAt }
template.fitcrew.members → Map<id, Member>
template.fitcrew.logs    → Map<id, WorkoutLog>
template.fitcrew.prizes  → Map<id, Prize>
```

`WorkoutLog` includes `dayKey` (`YYYY-MM-DD`) for streak math and optional `proofImage` (image brick JSON).

---

## Streaks

Computed client-side from distinct `dayKey` values per member (`lib/streaks.ts`):

- **Current streak** — consecutive days including today or yesterday
- **Best streak** — longest run in history
- **Weekly count** — logs since Monday (local time)

---

## Building blocks exercised

| Brick | Use in Fit Crew |
|-------|-----------------|
| `EmojiPicker` | Prize emoji |
| `ImageField` | Optional proof photo |
| `compactRoom` | After inline image upload |

---

## Code

```
apps/rooms/web/src/templates/fitcrew/
```

Registered in `templates/registry.ts` as builtin id `fitcrew`.

---

## Related

- [IMAGE_BRICK.md](./IMAGE_BRICK.md)
- [EMOJI_PICKER.md](./EMOJI_PICKER.md)
