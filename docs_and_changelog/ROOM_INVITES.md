# Room invites (contact brick)

**Date:** 2026-06-07  
**Status:** v1 shipped

---

## Flow

1. **Organizer** sets up a room and may pick **mutual contacts** to invite (`RoomMemberInviteField`). Invites are **optional at setup** — if none are selected, a soft reminder appears before continuing; members can always be invited later from `RoomInviteSettings`.
2. Each invitee gets a `room_invite` on the pairwise encrypted inbox.
3. **Invitee** sees **Room invitations** on Home when they open the app (`RoomInvitesBanner`).
4. **Accept** → vault entry with pre-assigned `memberSlotId` → opens room (skips ProfilePicker).
5. **Decline** → invite marked declined locally.

Mutual contact connection is required before room invites (same gate as messaging).

---

## Protocol

`room_invite` inbox message (`packages/room-kit/src/pairInbox.ts`):

| Field | Purpose |
|-------|---------|
| `roomCode` | Target room |
| `roomName` | Display name |
| `templateId` | Builtin or `declarative` |
| `memberSlotId` | CRDT member id reserved for invitee |
| `memberBinding` | Invitee persona public key |

---

## Building blocks

| Piece | Path |
|-------|------|
| Contact picker | `apps/rooms/web/src/components/RoomMemberInviteField.tsx` |
| Home notifications | `apps/rooms/web/src/components/RoomInvitesBanner.tsx` |
| Setup helper | `apps/rooms/web/src/lib/finishRoomSetup.ts` |
| Setup invite reminder | `apps/rooms/web/src/lib/useSetupFinishWithInviteReminder.tsx` |
| Send / accept | `PersonaContactsProvider` |

Used in all template Setup screens (Book Club, Fit Crew, Trip Split, Backlog, ChoreBoard, declarative).

**Post-setup:** admins see the same contact picker in **`RoomInviteSettings`** (`apps/rooms/web/src/shell/RoomInviteSettings.tsx`) — Settings (ChoreBoard) or the room footer (other templates). Requires `hasAdminAccess` (admin secret unlocked).

---

## Related

- [PERSONA_CONTACTS.md](./PERSONA_CONTACTS.md)
- [ROOM_DEVICE_DATA.md](./ROOM_DEVICE_DATA.md)
