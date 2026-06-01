# ChoreBoard — keys, permissions, and sync channels

## Three secrets (not one)

| Secret | Who gets it | Powers |
|--------|-------------|--------|
| **Family code** | Every device | Sync **public** channel: members, published chore catalog, completions, kid proposals |
| **Parent secret** | Parents only | Sync **admin** channel: edit chores, payday, settings; publish catalog to kids |
| **Member device link** | One kid profile per device | Sign that kid’s completions (HMAC); parent can verify |

Kids with only the family code **cannot decrypt the admin channel** — they never receive those ciphertext blobs from the relay.

## Relay rooms (same architecture, two pipes)

- `public` room — key derived from family code  
- `admin` room — key derived from family code + parent secret  

Same Go relay process; different room ids and AES keys.

## What kids can and cannot do

| Action | Kid (family code only) | Parent (+ parent secret) |
|--------|------------------------|---------------------------|
| Mark chore done | Yes (from published catalog) | Yes |
| Suggest new chore | Yes (public proposals) | — |
| Change chore price / catalog | **No** | Yes |
| Approve completions / payday | **No** | Yes |
| Add penalties | **No** | Yes |

**Crypto** stops kids from editing admin data. **Configurable kid permissions** (Settings → Kid permissions) control what each kid *sees* in the app — synced on the public channel.

### Default kid permissions (all on unless you turn off)

- See reward on each chore (e.g. $0.50) — **on by default**
- See own balance, pending, week earnings
- Mark done, suggest chores, activity history
- See sibling balances — **off by default**

Per-kid overrides available (e.g. one child sees rewards, another doesn’t).

Honest limit: permissions are **UI policy** on data already in the public sync doc. A modified client could ignore them; use member device links + signatures for stronger accountability.

## Member signatures

- Parent generates a **device link** when adding a kid (or from Settings).
- Kid device stores `memberSecret` locally and signs each completion.
- Parent can verify before approving if they also stored the link (optional).

Unsigned completions are allowed (shared tablet); parent sees a warning.

## Code strength

Family, parent, and member secrets are **16 bytes random** (~128 bits), URL-safe — not 4-word dictionaries.

## Fingerprint / MFA (later)

- **Face ID on this device** → unlock app/profile (local only).  
- **Parent approve new device** → true second factor for joining (future).  

Neither replaces the family / parent / member key model above.
