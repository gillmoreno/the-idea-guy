# Persona & contacts (decentralized)

**Date:** 2026-06-07  
**Status:** v1 foundation shipped

---

## Model (one list, not redundant whitelist + blacklist)

| Status | Meaning |
|--------|---------|
| `pending_out` | You added them; waiting for their accept (or mutual add) |
| `pending_in` | They want to connect — **you must Accept** |
| `mutual` | Both sides allow messages & room invites |
| `blocked` | **You** blocked them — no send/receive (unilateral) |

There is no separate whitelist file: **`mutual` is the allow list**. `blocked` is the deny list.

---

## Persona

- Created on first visit (X25519 keypair in device vault).
- **Contact code** + QR = public key + optional name (`rooms1.…`).
- Private key never leaves the device; relay never sees it.

---

## Pairwise inbox (same dumb relay)

For each contact pair, both peers derive:

- **Relay room** from sorted public keys
- **AES key** from X25519 ECDH shared secret

Messages (`friend_request`, `friend_accept`, `room_invite` later) are encrypted CRDT blobs — same architecture as room sync.

**Rules:**

- Incoming `friend_request` ignored if sender is `blocked`.
- `room_invite` (next phase) only processed if `mutual`.
- Either party can `block` unilaterally.

---

## Typical flow

1. Gil creates persona, shares QR with Matt.
2. Matt pastes Gil’s code → `pending_out` + `friend_request` sent.
3. Matt shares his QR; Gil adds Matt → if both added, inbox auto-`mutual`; else Matt sees **Accept**.
4. Gil taps Accept → `mutual` + `friend_accept` sent.
5. Only then: room invites from Gil to Matt (Fit Crew — next step).

---

## Code

| Piece | Path |
|-------|------|
| Crypto + cards | `packages/room-kit/src/persona.ts` |
| Contact rules | `packages/room-kit/src/contacts.ts` |
| Inbox messages | `packages/room-kit/src/pairInbox.ts` |
| Vault v2 | `packages/room-kit/src/vault.ts` |
| UI + sync | `apps/rooms/web/src/shell/PersonaContactsProvider.tsx` |
| Contacts page | `apps/rooms/web/src/app/contacts/page.tsx` |

---

## Next

- Fit Crew: invite **mutual** contacts from roster (send `room_invite`, auto-bind member slot).
- Replace ProfilePicker when device has room membership from invite.
- Optional: parse `?contact=` on join URL to pre-fill add-contact.
