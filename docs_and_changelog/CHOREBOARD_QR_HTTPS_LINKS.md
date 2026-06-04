# ChoreBoard QR codes → website links

**Date:** 2026-06-04

## Change

QR codes previously encoded `choreboard://…` deep links, which require a native app that does not exist. They now encode **HTTPS URLs** on the hosted PWA:

| QR | URL pattern |
|----|-------------|
| Join family | `https://chores.the-idea-guy.com/?join=<familyCode>` |
| Parent unlock | `https://chores.the-idea-guy.com/?parent=<secret>` |
| Kid device link | `https://chores.the-idea-guy.com/?member=<link>` |

Scanning with the phone camera opens the site directly. Invite params are removed from the address bar after use.

## Code

- `choreboard/web/src/kit/qr.ts`
- `Welcome.tsx` — auto-join when `?join=` is present
- `ParentGate.tsx` / `ProfilePicker.tsx` — handle `?parent=` / `?member=`

Build-time origin: `NEXT_PUBLIC_APP_URL` in `deploy/subdomains.json`.

**Ship to production:** `./scripts/deploy-chores.sh`
