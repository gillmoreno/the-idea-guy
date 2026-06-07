# Book Club — shared reading room for small groups

**Date:** 2026-06-07  
**Status:** v1 shipped in `apps/rooms/web/src/templates/bookclub/`

---

## What it does

Book Club is the third **Rooms** template. A small group tracks what they’re reading, queues suggestions, sets a meetup date, and leaves discussion notes before the next gathering.

| Feature | v1 |
|---------|-----|
| Current book | One active read at a time |
| Queue | Members suggest upcoming titles |
| Archive | Finished books auto-move when a new one starts or you mark done |
| Meeting date | Per current book (editable) |
| Notes | Text notes on the current book, attributed to member |

**Local-first:** Yjs CRDT + E2E encrypted relay sync — same as ChoreBoard and Trip Split.

---

## Create & join

1. **Create** → pick **Book Club** → club name + members (min 2).
2. **Share** room code; friends **Join** from Rooms home.
3. Each device picks **who’s on this device**.
4. **Reading** tab — pick or start a book, set meeting, add notes.
5. **Queue** tab — suggest books; anyone can **Start reading this**.
6. **Archive** — past reads.

---

## Data model (`template.bookclub.*`)

```
template.bookclub.club    → { name, createdAt }
template.bookclub.members → Map<id, { id, name, color, joinedAt }>
template.bookclub.books   → Map<id, { title, author, status, meetingDate?, … }>
template.bookclub.notes   → Map<id, { bookId, authorId, body, createdAt }>
```

`status`: `reading` | `queued` | `done`

---

## v1 limits

- No voting on queue picks (first-come promote to current).
- Notes only on the **current** book (not archived titles).
- Members added at setup only.
- No page progress or “% read” tracking.

---

## Local dev

```bash
cd apps/rooms && make dev
```

Open **http://localhost:3300** — relay at `ws://localhost:4500`.

Try Trip Split and Book Club from **Create a room** → pick template.

---

## Related

- [ROOM_KIT.md](./ROOM_KIT.md) — shell flows
- [TRIP_SPLIT.md](./TRIP_SPLIT.md) — second template precedent
