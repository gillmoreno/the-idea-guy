# Room data on device

**Date:** 2026-06-07  
**Status:** v1 shipped (home screen remove)

---

## What lives locally

| Layer | Storage |
|-------|---------|
| Room bookmarks (code, name, keys) | `localStorage` → `rooms.vault.v1` |
| Encrypted CRDT blobs | IndexedDB → `rooms:public:…` / `rooms:admin:…` |
| Pending declarative schema | `sessionStorage` → `rooms.pendingSchema.{code}` |
| ChoreBoard member link secrets | `localStorage` → `choreboard.memberSecret.{memberId}` |

Persona and contacts stay in the vault when you remove a room.

---

## Remove from device

Home → **Your rooms** → **Remove** on a room card.

`purgeRoomFromDevice()` (`apps/rooms/web/src/lib/purgeRoomFromDevice.ts`):

1. Deletes public + admin IndexedDB for that room
2. Clears related session/local keys
3. Removes the room from the device vault

Does **not** delete data on other devices or the relay. Rejoin with the invite code to sync again.

---

## Related

- [PERSONA_CONTACTS.md](./PERSONA_CONTACTS.md)
