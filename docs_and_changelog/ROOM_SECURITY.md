# Room security — v1

**Date:** 2026-06-09  
**Status:** Shipped (client-only, no new servers)

Three serverless security features:

1. **Invite links in URL hash** — room codes never hit CDN/server logs  
2. **Optional room passphrase** — second secret, Argon2id, out-of-band  
3. **Device app lock** — PIN encrypts the local vault on this device  

---

## 1. Hash-based invite links

**Problem:** Room codes in query strings (`?c=`, `?code=`) are logged by CDNs and link-preview bots.

**Fix:** All invite params live in the URL **fragment** (hash):

| Link | Format |
|------|--------|
| Open room | `/room#c={roomCode}` |
| Member join | `/join#c={roomCode}` |
| Admin join | `/join#c={code}&admin={secret}&template={id}` |

Browsers **never send the hash** to the server. Legacy query links still parse for backward compatibility; `stripInviteParamsFromUrl()` cleans the address bar after load.

**Code:** `packages/room-kit/src/links.ts`

---

## 2. Room passphrase (optional)

**Problem:** Room code alone = full access if the link leaks.

**Fix:** Owner optionally sets a **passphrase at create**. Key derivation:

| | No passphrase (legacy) | With passphrase |
|--|------------------------|-----------------|
| AES key | `SHA-256(keyMaterial)` | `Argon2id(roomCode ∥ passphrase)` |
| Relay room id | `SHA-256(app:scope:code)` | `Argon2id(...)` — ciphertext not fetchable without passphrase |

- Passphrase stored on device in `VaultRoom.roomPassphrase` (like admin secret).
- **Never** in invite URLs or relay.
- **No recovery** — forget passphrase → room unreadable. UI warns loudly.

**Also fixed:** `generateSecret()` now uses proper base64url (128-bit / 22 chars). Existing 16-char room codes remain valid.

**Code:** `packages/room-kit/src/crypto.ts`, create/join flows, `RoomSessionProvider`

---

## 3. App lock (device PIN)

**Problem:** Room codes and passphrases sit in `localStorage` — readable if someone opens the browser.

**Fix:** Optional **PIN** encrypts the entire device vault:

- `rooms.vault.v1.lock` — salt + verifier metadata  
- `rooms.vault.v1.cipher` — AES-GCM encrypted vault JSON  
- Plain `rooms.vault.v1` removed while lock enabled  

Unlock derives key via **Argon2id(PIN, salt)**. Session holds decrypted vault + PIN for re-encrypt on save.

**No server. No recovery.** Forget PIN → rejoin rooms with invite codes (local copy lost).

**UI:** Profile → App lock

**Code:** `packages/room-kit/src/vaultLock.ts`, `apps/rooms/web/src/shell/VaultLockProvider.tsx`

---

## What we still do NOT have

- Forward secrecy / member revocation (remove member → old code still works on public channel)
- Server-side 2FA (intentionally skipped — needs accounts)
- Operator cannot read ciphertext on relay (unchanged zero-access model)

---

## Related

- [BACKGROUND_ROOM_SYNC.md](./BACKGROUND_ROOM_SYNC.md)
- [ROOM_KIT_ARCHITECTURE.md](./ROOM_KIT_ARCHITECTURE.md)
- [business-plan-and-next-steps.html](./business-plan-and-next-steps.html)
