# Backlog — shared idea pool for what to build next

**Date:** 2026-06-07  
**Status:** v1 shipped in `apps/rooms/web/src/templates/backlog/`

---

## Why a room, not a database

The Backlog is a **Rooms template** — same stack as ChoreBoard, Trip Split, and Book Club:

- Yjs CRDT on each device
- E2E encrypted sync via the dumb relay
- Invite code = “public-ish” participation without Postgres

Anyone with the room code can join, propose ideas, and vote. You (owner) set **status** on each idea: proposed → building → shipped → parked.

No central server reads the ideas. That matches the product story: *local-first, even for community input.*

---

## Seeded ideas (v1)

On first setup, three extension templates are pre-loaded:

| Emoji | Idea | Pitch |
|-------|------|-------|
| 🏠💡 | **Roommate Ledger** | Household bills — Trip Split for daily life |
| 🍿📺 | **Watch Club** | Book Club for TV — series, episodes, queue |
| 🥗🍷 | **Potluck** | Who brings what, dietary tags, headcount |

Users can add more proposals anytime.

---

## Flows

1. **Create** → **Backlog** → name the pool + voters
2. **Share** room code — friends join and pick their voter profile
3. **Propose** — title, emoji, short pitch
4. **Vote** — one vote per person per idea (toggle)
5. **Owner** — change status dropdown per idea

Ideas sort by vote count (then recency).

---

## Data model (`template.backlog.*`)

```
template.backlog.board   → { name, createdAt }
template.backlog.members → Map<id, member>
template.backlog.ideas   → Map<id, { title, description, emoji, status, proposedById, … }>
template.backlog.votes   → Map<ideaId, Map<memberId, votedAt>>
```

---

## Future

- Link **shipped** ideas to a new template in the registry
- Optional read-only “showcase” room code on the marketing site
- Import/export seed list for your public roadmap

---

## Look & feel experiments

Four CSS-only themes (no images) — switch on Home or Create:

| Theme | Vibe |
|-------|------|
| **Classic** | Current minimal baseline |
| **Paper** | Warm stone neutrals, flat cards (classic-adjacent) |
| **Signal** | Dot grid, cyan accent, sharp panels |
| **Glow** | Dark glass, gradient buttons |

Stored in `localStorage` as `rooms.theme.v1`.

---

## Yjs single-instance rule

Template stores import `Y` from `@the-idea-guy/room-kit` (not `yjs` directly). Webpack aliases one `yjs` copy for app + room-kit. Duplicate Yjs broke `instanceof Y.Map` and corrupted CRDT state ([yjs#438](https://github.com/yjs/yjs/issues/438)). Rooms created before this fix may need to be recreated.

See also: [ROOM_KIT.md](./ROOM_KIT.md)
